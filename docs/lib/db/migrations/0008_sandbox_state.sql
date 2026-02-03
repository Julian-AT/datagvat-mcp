CREATE TABLE "SandboxState" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sandboxId" varchar(255) NOT NULL,
	"messageId" uuid NOT NULL,
	"chatId" uuid NOT NULL,
	"title" text NOT NULL,
	"code" text NOT NULL,
	"outputs" json,
	"hasApprovedOnce" boolean DEFAULT false,
	"e2bSandboxId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "SandboxState_sandboxId_unique" UNIQUE("sandboxId")
);
--> statement-breakpoint
ALTER TABLE "SandboxState" ADD CONSTRAINT "SandboxState_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SandboxState" ADD CONSTRAINT "SandboxState_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
