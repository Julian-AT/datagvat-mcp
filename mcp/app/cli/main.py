"""Main entry point for data.gv.at MCP Server and CLI installer."""

import json
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Annotated

import typer
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.prompt import Confirm
from rich.table import Table

app = typer.Typer(
    name="datagvat-mcp",
    help="Austrian Open Government Data MCP Server",
    no_args_is_help=False,
    invoke_without_command=True,
    rich_markup_mode="rich",
)

console = Console()

# Tool configuration paths by platform
TOOL_PATHS = {
    "darwin": {
        "claude-desktop": "~/Library/Application Support/Claude/claude_desktop_config.json",
        "continue": "~/.continue/config.json",
        "cline": "~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
    },
    "win32": {
        "claude-desktop": "%APPDATA%/Claude/claude_desktop_config.json",
        "continue": "%USERPROFILE%/.continue/config.json",
        "cline": "%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
    },
    "linux": {
        "claude-desktop": "~/.config/Claude/claude_desktop_config.json",
        "continue": "~/.config/continue/config.json",
        "cline": "~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
    },
}

MCP_CONFIG = {
    "command": "uvx",
    "args": ["datagvat-mcp"],
}


def get_platform() -> str:
    """Get the current platform identifier."""
    system = platform.system().lower()
    if system == "darwin":
        return "darwin"
    elif system == "windows":
        return "win32"
    return "linux"


def expand_path(path: str) -> Path:
    """Expand environment variables and user home in path."""
    if "%APPDATA%" in path:
        path = path.replace("%APPDATA%", os.environ.get("APPDATA", ""))
    if "%USERPROFILE%" in path:
        path = path.replace("%USERPROFILE%", os.environ.get("USERPROFILE", ""))
    return Path(os.path.expanduser(path))


def get_tool_paths() -> dict[str, Path]:
    """Get tool config paths for the current platform."""
    plat = get_platform()
    paths = TOOL_PATHS.get(plat, TOOL_PATHS["linux"])
    return {name: expand_path(path) for name, path in paths.items()}


def detect_tools() -> dict[str, dict]:
    """Detect installed AI tools."""
    tool_paths = get_tool_paths()
    results = {}

    for name, config_path in tool_paths.items():
        detected = config_path.exists() or config_path.parent.exists()
        results[name] = {
            "name": name,
            "config_path": config_path,
            "detected": detected,
        }

    return results


def configure_tool(tool_name: str, config_path: Path) -> tuple[bool, str]:
    """Configure a single tool. Returns (success, message)."""
    try:
        if config_path.exists():
            try:
                config = json.loads(config_path.read_text())
            except json.JSONDecodeError:
                config = {}
        else:
            config_path.parent.mkdir(parents=True, exist_ok=True)
            config = {}

        if "mcpServers" not in config:
            config["mcpServers"] = {}

        if "datagvat" in config["mcpServers"]:
            return False, "Already configured"

        config["mcpServers"]["datagvat"] = MCP_CONFIG
        config_path.write_text(json.dumps(config, indent=2) + "\n")
        return True, f"Configured at {config_path}"

    except PermissionError:
        return False, "Permission denied"
    except Exception as e:
        return False, str(e)


def run_command(cmd: list[str]) -> tuple[bool, str]:
    """Run a command and return (success, output)."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return result.returncode == 0, result.stdout.strip()
    except FileNotFoundError:
        return False, "Not found"
    except subprocess.TimeoutExpired:
        return False, "Timeout"
    except Exception as e:
        return False, str(e)


@app.callback()
def main(
    ctx: typer.Context,
    version: Annotated[bool, typer.Option("--version", "-v", help="Show version")] = False,
) -> None:
    """Austrian Open Government Data MCP Server.

    Run without arguments to start the MCP server.
    Use subcommands (init, doctor, update) to manage installation.
    """
    if version:
        console.print("datagvat-mcp version 1.0.0")
        raise typer.Exit()

    # If no subcommand, run the MCP server
    if ctx.invoked_subcommand is None:
        from app.server import mcp
        mcp.run()


@app.command()
def init(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip prompts and configure all detected tools")] = False,
    tool: Annotated[str | None, typer.Option("--tool", "-t", help="Configure specific tool only")] = None,
) -> None:
    """Initialize MCP server in AI tools (Claude Desktop, Continue, Cline)."""
    console.print()
    console.print(Panel.fit(
        "[bold cyan]data.gv.at MCP Installer[/bold cyan]\n[dim]One-command setup for Austrian Open Data MCP Server[/dim]",
        border_style="cyan",
    ))
    console.print()

    # Step 1: Detect tools
    console.print("[cyan][1/3][/cyan] Scanning for AI tools")
    console.print()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True,
    ) as progress:
        progress.add_task("Checking for Claude Desktop, Continue, and Cline...", total=None)
        tools = detect_tools()

    detected = {name: info for name, info in tools.items() if info["detected"]}

    if not detected:
        console.print("[yellow]![/yellow] No AI tools detected on this system")
        console.print()
        console.print("[dim]Supported tools:[/dim]")
        console.print("  [dim]o[/dim] Claude Desktop: https://claude.ai/download")
        console.print("  [dim]o[/dim] Continue: https://continue.dev")
        console.print("  [dim]o[/dim] Cline: VS Code extension")
        console.print()
        raise typer.Exit(0)

    console.print(f"[green]✓[/green] Found {len(detected)} tool(s)")
    console.print()
    for name, info in detected.items():
        console.print(f"  [green]●[/green] [cyan]{name}[/cyan] [dim]({info['config_path']})[/dim]")
    console.print()

    # Step 2: Select tools
    console.print("[cyan][2/3][/cyan] Select tools to configure")
    console.print()

    if tool:
        if tool not in detected:
            console.print(f"[red]✗[/red] Tool '{tool}' not detected on this system")
            console.print(f"[cyan]ℹ[/cyan] [dim]Detected tools: {', '.join(detected.keys())}[/dim]")
            raise typer.Exit(1)
        tools_to_configure = {tool: detected[tool]}
        console.print(f"[cyan]ℹ[/cyan] [dim]Configuring specific tool: {tool}[/dim]")
    elif yes:
        tools_to_configure = detected
        console.print("[cyan]ℹ[/cyan] [dim]Configuring all detected tools (--yes flag)[/dim]")
    else:
        tools_to_configure = {}
        for name, info in detected.items():
            if Confirm.ask(f"  Configure [cyan]{name}[/cyan]?", default=True):
                tools_to_configure[name] = info

        if not tools_to_configure:
            console.print("[yellow]![/yellow] No tools selected")
            raise typer.Exit(0)

    console.print()

    # Step 3: Configure
    console.print("[cyan][3/3][/cyan] Writing configuration")
    console.print()

    configured = 0
    skipped = 0
    failed = 0

    for name, info in tools_to_configure.items():
        success, message = configure_tool(name, info["config_path"])
        if success:
            configured += 1
            console.print(f"[green]✓[/green] {name}: {message}")
        elif "Already configured" in message:
            skipped += 1
            console.print(f"[yellow]![/yellow] {name}: {message}")
        else:
            failed += 1
            console.print(f"[red]✗[/red] {name}: {message}")

    # Summary
    console.print()
    if configured > 0:
        console.print(f"[green]✓[/green] Configured {configured} tool(s) successfully")
    if skipped > 0:
        console.print(f"[cyan]ℹ[/cyan] [dim]Skipped {skipped} tool(s) (already configured)[/dim]")
    if failed > 0:
        console.print(f"[red]✗[/red] Failed to configure {failed} tool(s)")

    # Post-install guidance
    if configured > 0:
        console.print()
        console.print(Panel.fit(
            "[bold green]Installation complete![/bold green]\n\n"
            "[dim]Restart your AI tools to load the MCP server[/dim]",
            border_style="green",
        ))
        console.print()
        console.print("[bold]Try these queries:[/bold]")
        console.print("  [dim]●[/dim] Find datasets about Vienna population")
        console.print("  [dim]●[/dim] Show me health-related open data")
        console.print("  [dim]●[/dim] What datasets have quality score above 80?")
        console.print()
        console.print(f"[dim]Docs:[/dim] [cyan]https://datagvat-mcp-docs.vercel.app[/cyan]")
        console.print()


@app.command()
def doctor(
    fix: Annotated[bool, typer.Option("--fix", help="Show fix instructions")] = False,
) -> None:
    """Check installation health and diagnose issues."""
    console.print()
    console.print(Panel.fit(
        "[bold cyan]Health Check[/bold cyan]\n[dim]Diagnose MCP Server configuration[/dim]",
        border_style="cyan",
    ))
    console.print()

    checks = []
    tools = detect_tools()
    detected = {name: info for name, info in tools.items() if info["detected"]}

    # Check: Tools detected
    if detected:
        configured_count = sum(1 for info in detected.values() if info["config_path"].exists())
        checks.append(("Config files exist", True, f"Found {configured_count} config file(s)", None))
    else:
        checks.append(("Config files exist", False, "No config files found", "Run: datagvat-mcp init"))

    # Check: Valid JSON
    invalid_tools = []
    for name, info in detected.items():
        if info["config_path"].exists():
            try:
                json.loads(info["config_path"].read_text())
            except json.JSONDecodeError:
                invalid_tools.append(name)

    if invalid_tools:
        checks.append(("Valid JSON", False, f"Invalid: {', '.join(invalid_tools)}", "Fix JSON syntax"))
    elif detected:
        checks.append(("Valid JSON", True, "All configs are valid JSON", None))

    # Check: MCP entry exists
    missing_entry = []
    for name, info in detected.items():
        if info["config_path"].exists():
            try:
                config = json.loads(info["config_path"].read_text())
                if not config.get("mcpServers", {}).get("datagvat"):
                    missing_entry.append(name)
            except Exception:
                pass

    if missing_entry:
        checks.append(("MCP entry exists", False, f"Missing: {', '.join(missing_entry)}", "Run: datagvat-mcp init"))
    elif detected:
        checks.append(("MCP entry exists", True, "MCP server configured in all tools", None))

    # Check: Python
    success, output = run_command([sys.executable, "--version"])
    if success:
        checks.append(("Python", True, output, None))
    else:
        checks.append(("Python", False, "Not found", "Install Python 3.11+"))

    # Check: uvx
    uvx_path = shutil.which("uvx")
    if uvx_path:
        checks.append(("uvx", True, "Available for running MCP server", None))
    else:
        checks.append(("uvx", False, "Not found (required)", "Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"))

    # Display results
    table = Table(show_header=True, header_style="bold")
    table.add_column("Check", style="cyan", width=20)
    table.add_column("Status", width=8)
    table.add_column("Details")

    errors = 0
    warnings = 0

    for check_name, passed, message, fix_hint in checks:
        if passed:
            status = "[green]✓ OK[/green]"
        else:
            status = "[red]✗ FAIL[/red]"
            errors += 1

        details = message
        if fix_hint and fix:
            details += f"\n[dim]→ {fix_hint}[/dim]"

        table.add_row(check_name, status, details)

    console.print(table)
    console.print()

    if errors == 0:
        console.print("[green]✓[/green] All checks passed")
    else:
        console.print(f"[red]✗[/red] {errors} issue(s) found")
        if not fix:
            console.print("[dim]Run with --fix for solutions[/dim]")
        raise typer.Exit(1)

    console.print()


@app.command()
def update(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip prompts")] = False,
    tool: Annotated[str | None, typer.Option("--tool", "-t", help="Update specific tool")] = None,
) -> None:
    """Update MCP server configuration to latest version."""
    console.print()
    console.print(Panel.fit(
        "[bold cyan]Update Configuration[/bold cyan]\n[dim]Update MCP server to latest config[/dim]",
        border_style="cyan",
    ))
    console.print()

    tools = detect_tools()
    configured = {}

    for name, info in tools.items():
        if info["detected"] and info["config_path"].exists():
            try:
                config = json.loads(info["config_path"].read_text())
                if config.get("mcpServers", {}).get("datagvat"):
                    configured[name] = info
            except Exception:
                pass

    if not configured:
        console.print("[red]✗[/red] No configured tools found")
        console.print("[dim]Run: datagvat-mcp init[/dim]")
        raise typer.Exit(1)

    console.print(f"[green]✓[/green] Found {len(configured)} configured tool(s)")
    console.print()

    if tool:
        if tool not in configured:
            console.print(f"[red]✗[/red] Tool '{tool}' not configured")
            raise typer.Exit(1)
        tools_to_update = {tool: configured[tool]}
    elif yes:
        tools_to_update = configured
    else:
        tools_to_update = {}
        for name, info in configured.items():
            if Confirm.ask(f"  Update [cyan]{name}[/cyan]?", default=True):
                tools_to_update[name] = info

    updated = 0
    for name, info in tools_to_update.items():
        try:
            config = json.loads(info["config_path"].read_text())
            old_config = config.get("mcpServers", {}).get("datagvat", {})

            if old_config == MCP_CONFIG:
                console.print(f"[cyan]ℹ[/cyan] [dim]{name}: Already up to date[/dim]")
                continue

            config["mcpServers"]["datagvat"] = MCP_CONFIG
            info["config_path"].write_text(json.dumps(config, indent=2) + "\n")
            console.print(f"[green]✓[/green] {name}: Updated")
            updated += 1
        except Exception as e:
            console.print(f"[red]✗[/red] {name}: {e}")

    console.print()
    if updated > 0:
        console.print(f"[green]✓[/green] Updated {updated} tool(s)")
    else:
        console.print("[cyan]ℹ[/cyan] [dim]No updates needed[/dim]")
    console.print()


if __name__ == "__main__":
    app()
