"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export const SignOutForm = () => {
  const router = useRouter();

  return (
    <form className="w-full">
      <button
        className="w-full px-1 py-0.5 text-left text-red-500"
        onClick={async (e) => {
          e.preventDefault();
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/");
                router.refresh();
              },
            },
          });
        }}
        type="button"
      >
        Sign out
      </button>
    </form>
  );
};
