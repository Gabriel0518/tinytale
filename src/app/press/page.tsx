import { redirect } from "next/navigation";

export default function PressRedirectPage() {
  redirect("/help?tab=about&section=press");
}
