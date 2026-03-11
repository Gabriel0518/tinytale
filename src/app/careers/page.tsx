import { redirect } from "next/navigation";

export default function CareersRedirectPage() {
  redirect("/help?tab=about&section=careers");
}
