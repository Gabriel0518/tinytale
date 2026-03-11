import { redirect } from "next/navigation";

export default function AboutRedirectPage() {
  redirect("/help?tab=about&section=mission");
}
