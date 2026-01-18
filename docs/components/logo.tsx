export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="28" height="28" rx="6" fill="#b91e23" />
        <path
          d="M9 19L14 10L19 19H16.5L14 14.5L11.5 19H9Z"
          fill="white"
        />
        <path
          d="M11 9H17V11H11V9Z"
          fill="white"
        />
      </svg>
      <span className="text-sm font-semibold">Austria MCP</span>
    </div>
  );
}
