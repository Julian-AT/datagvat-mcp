"""Main CLI entry point for data.gv.at MCP Server installer."""

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
from rich.text import Text

app = typer.Typer(
    name="datagvat-mcp",
    help="CLI installer for data.gv.at MCP Server - Austrian Open Government Data",
    no_args_is_help=True,
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
    # Handle Windows environment variables
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
        # Check if config file exists OR parent directory exists
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
        # Read or create config
        if config_path.exists():
            try:
                config = json.loads(config_path.read_text())
            except json.JSONDecodeError:
                config = {}
        else:
            # Create parent directory if needed
            config_path.parent.mkdir(parents=True, exist_ok=True)
            config = {}

        # Initialize mcpServers if needed
        if "mcpServers" not in config:
            config["mcpServers"] = {}

        # Check if already configured
        if "datagvat" in config["mcpServers"]:
            return False, "Already configured"

        # Add our MCP server
        config["mcpServers"]["datagvat"] = MCP_CONFIG

        # Write back
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


@app.command()
def init(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip prompts and configure all detected tools")] = False,
    tool: Annotated[str | None, typer.Option("--tool", "-t", help="Configure specific tool only")] = None,
) -> None:
    """Initialize data.gv.at MCP Server in AI tools."""
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

    console.print(f"[green]v[/green] Found {len(detected)} tool(s)")
    console.print()
    for name, info in detected.items():
        console.print(f"  [green]o[/green] [cyan]{name}[/cyan] [dim]({info['config_path']})[/dim]")
    console.print()

    # Step 2: Select tools
    console.print("[cyan][2/3][/cyan] Select tools to configure")
    console.print()

    if tool:
        if tool not in detected:
            console.print(f"[red]x[/red] Tool '{tool}' not detected on this system")
            console.print(f"[cyan]i[/cyan] [dim]Detected tools: {', '.join(detected.keys())}[/dim]")
            raise typer.Exit(1)
        tools_to_configure = {tool: detected[tool]}
        console.print(f"[cyan]i[/cyan] [dim]Configuring specific tool: {tool}[/dim]")
    elif yes:
        tools_to_configure = detected
        console.print("[cyan]i[/cyan] [dim]Configuring all detected tools (--yes flag)[/dim]")
    else:
        # Interactive selection
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

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True,
    ) as progress:
        progress.add_task("Updating configuration files...", total=None)

        for name, info in tools_to_configure.items():
            success, message = configure_tool(name, info["config_path"])
            if success:
                configured += 1
                console.print(f"[green]v[/green] {name}: {message}")
            elif "Already configured" in message:
                skipped += 1
                console.print(f"[yellow]![/yellow] {name}: {message}")
            else:
                failed += 1
                console.print(f"[red]x[/red] {name}: {message}")

    # Summary
    console.print()
    if configured > 0:
        console.print(f"[green]v[/green] Configured {configured} tool(s) successfully")
    if skipped > 0:
        console.print(f"[cyan]i[/cyan] [dim]Skipped {skipped} tool(s) (already configured)[/dim]")
    if failed > 0:
        console.print(f"[red]x[/red] Failed to configure {failed} tool(s)")

    # Post-install guidance
    if configured > 0:
        console.print()
        console.print(Panel.fit(
            "[green bold]Installation complete![/green bold]\n\n[dim]The data.gv.at MCP Server has been configured[/dim]",
            border_style="green",
        ))
        console.print()
        console.print("[bold]Next Steps[/bold]")
        console.print()
        console.print("[cyan]1. Restart your tools[/cyan]")
        for name in tools_to_configure:
            if name == "claude-desktop":
                console.print(f"   [bold]{name}[/bold]")
                console.print("   [dim]->[/dim] Quit and restart Claude Desktop app")
            else:
                console.print(f"   [bold]{name}[/bold]")
                console.print("   [dim]->[/dim] Reload VS Code window (Cmd/Ctrl+Shift+P -> 'Developer: Reload Window')")
        console.print()
        console.print("[cyan]2. Try these example queries[/cyan]")
        console.print("   [dim]o[/dim] [italic]Find datasets about Vienna population[/italic]")
        console.print("   [dim]o[/dim] [italic]Show me datasets with quality score above 80[/italic]")
        console.print("   [dim]o[/dim] [italic]What health-related datasets are available?[/italic]")
        console.print()
        console.print("[cyan]3. Learn more[/cyan]")
        console.print("   [dim]Documentation:[/dim] [cyan underline]https://datagvat-mcp-docs.vercel.app[/cyan underline]")
        console.print("   [dim]Source code:[/dim]   [cyan underline]https://github.com/julian-at/datagvat-mcp[/cyan underline]")
        console.print()


@app.command()
def doctor(
    fix: Annotated[bool, typer.Option("--fix", help="Show fix instructions for issues")] = False,
) -> None:
    """Check configuration health and diagnose issues."""
    console.print()
    console.print(Panel.fit(
        "[bold cyan]Health Check[/bold cyan]\n[dim]Diagnose data.gv.at MCP Server configuration[/dim]",
        border_style="cyan",
    ))
    console.print()

    checks = []

    # Check 1: Config files exist
    console.print("[dim]Running health checks...[/dim]")
    console.print()

    tools = detect_tools()
    detected = {name: info for name, info in tools.items() if info["detected"]}

    # Check: Tools detected
    if detected:
        configured_count = sum(1 for info in detected.values() if info["config_path"].exists())
        checks.append(("Config files exist", True, f"Config files exist for {configured_count} tool(s)", None))
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
        checks.append(("Config files are valid JSON", False, f"Invalid JSON in: {', '.join(invalid_tools)}", "Fix JSON syntax manually"))
    else:
        checks.append(("Config files are valid JSON", True, "All config files are valid JSON", None))

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
        checks.append(("MCP server entry exists", False, f"Missing for: {', '.join(missing_entry)}", f"Run: datagvat-mcp init --tool {missing_entry[0]}"))
    else:
        checks.append(("MCP server entry exists", True, "MCP server entry exists in all configs", None))

    # Check: Python available
    success, output = run_command([sys.executable, "--version"])
    if success:
        checks.append(("Python is available", True, f"Python {output.replace('Python ', '')} is installed", None))
    else:
        checks.append(("Python is available", False, "Python not found", "Install Python 3.11+"))

    # Check: uv available
    success, output = run_command(["uv", "--version"])
    if success:
        checks.append(("uv is available", True, f"uv {output.replace('uv ', '')} is installed", None))
    else:
        checks.append(("uv is available", False, "uv not found (recommended)", "Install: curl -LsSf https://astral.sh/uv/install.sh | sh"))

    # Check: uvx available
    uvx_path = shutil.which("uvx")
    if uvx_path:
        checks.append(("uvx is available", True, "uvx is available for running MCP server", None))
    else:
        checks.append(("uvx is available", False, "uvx not found (required)", "Install uv, uvx is included"))

    # Display results
    table = Table(show_header=True, header_style="bold")
    table.add_column("Check", style="cyan")
    table.add_column("Status")
    table.add_column("Details")

    errors = 0
    warnings = 0

    for check_name, passed, message, fix_hint in checks:
        if passed:
            status = "[green]v PASS[/green]"
        elif "optional" in message.lower() or "recommended" in message.lower():
            status = "[yellow]! WARN[/yellow]"
            warnings += 1
        else:
            status = "[red]x FAIL[/red]"
            errors += 1

        details = message
        if fix_hint and fix:
            details += f"\n[dim]Fix: {fix_hint}[/dim]"

        table.add_row(check_name, status, details)

    console.print(table)
    console.print()

    if errors == 0 and warnings == 0:
        console.print("[green]v[/green] All checks passed")
    elif errors > 0:
        console.print(f"[red]x[/red] {errors} critical issue(s) found")
        if warnings > 0:
            console.print(f"[yellow]![/yellow] {warnings} warning(s) found")
        raise typer.Exit(1)
    else:
        console.print(f"[yellow]![/yellow] {warnings} warning(s) found")

    console.print()


@app.command()
def update(
    yes: Annotated[bool, typer.Option("--yes", "-y", help="Skip prompts and update all tools")] = False,
    tool: Annotated[str | None, typer.Option("--tool", "-t", help="Update specific tool only")] = None,
) -> None:
    """Update data.gv.at MCP Server configuration."""
    console.print()
    console.print(Panel.fit(
        "[bold cyan]Update Configuration[/bold cyan]\n[dim]Update data.gv.at MCP Server configuration[/dim]",
        border_style="cyan",
    ))
    console.print()

    # Detect configured tools
    console.print("[cyan][1/2][/cyan] Detecting configured tools")
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
        console.print("[red]x[/red] No configured tools found")
        console.print()
        console.print("[dim]Fix: Run the init command first[/dim]")
        console.print("  $ datagvat-mcp init")
        raise typer.Exit(1)

    console.print(f"[green]v[/green] Found {len(configured)} configured tool(s)")
    console.print()
    for name, info in configured.items():
        console.print(f"  [green]o[/green] [cyan]{name}[/cyan] [dim]({info['config_path']})[/dim]")
    console.print()

    # Select tools to update
    console.print("[cyan][2/2][/cyan] Updating configuration")
    console.print()

    if tool:
        if tool not in configured:
            console.print(f"[red]x[/red] Tool '{tool}' not found in configured tools")
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
                console.print(f"[cyan]i[/cyan] [dim]{name}: Already up to date[/dim]")
                continue

            config["mcpServers"]["datagvat"] = MCP_CONFIG
            info["config_path"].write_text(json.dumps(config, indent=2) + "\n")
            console.print(f"[green]v[/green] {name}: Updated configuration")
            updated += 1
        except Exception as e:
            console.print(f"[red]x[/red] {name}: {e}")

    console.print()
    if updated > 0:
        console.print(f"[green]v[/green] Updated {updated} tool(s)")
    else:
        console.print("[cyan]i[/cyan] [dim]No updates needed[/dim]")
    console.print()


@app.command()
def add(
    tool_name: Annotated[str, typer.Argument(help="Tool to add (claude-desktop, continue, cline)")],
) -> None:
    """Add data.gv.at MCP Server to a specific tool."""
    init(yes=False, tool=tool_name)


def main() -> None:
    """Entry point for the CLI."""
    app()


if __name__ == "__main__":
    main()
