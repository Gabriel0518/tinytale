import { redirect } from "next/navigation";

export default function CookiesRedirectPage() {
  redirect("/help?tab=privacy&section=pp-cookies");
}
