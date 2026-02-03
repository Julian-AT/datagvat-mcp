CREATE TABLE "ToolApproval" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"toolCallId" varchar(255) NOT NULL,
	"chatId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"toolName" varchar(255) NOT NULL,
	"approved" boolean NOT NULL,
	"deniedReason" text,
	"approvedAt" timestamp DEFAULT now() NOT NULL,
	"codeHash" varchar(64),
	CONSTRAINT "ToolApproval_toolCallId_unique" UNIQUE("toolCallId")
);
--> statement-breakpoint
ALTER TABLE "ToolApproval" ADD CONSTRAINT "ToolApproval_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ToolApproval" ADD CONSTRAINT "ToolApproval_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
