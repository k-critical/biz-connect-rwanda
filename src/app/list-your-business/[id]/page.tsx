import { redirect } from "next/navigation";

export default async function WizardStart({ params }: PageProps<"/list-your-business/[id]">) {
  redirect(`/list-your-business/${(await params).id}/details`);
}
