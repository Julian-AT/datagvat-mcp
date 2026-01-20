import Image from "next/image"

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/logo.svg" alt="data.gv.at MCP Server Logo" width={28} height={28} />
      <span className="text-sm font-semibold">data.gv.at MCP</span>
    </div>
  );
}
