import { redirect } from "next/navigation";

export default function PrivacyRedirectPage() {
  redirect("/help?tab=privacy&section=pp-intro");
}
