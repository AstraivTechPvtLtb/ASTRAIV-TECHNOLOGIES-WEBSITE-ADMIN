import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminApplicationsRedirect() {
  redirect('/recruitment?tab=applications');
}
