import { redirect } from "next/navigation";

export default function TermsRedirectPage() {
  redirect("/help?tab=terms&section=tos-intro");
}
