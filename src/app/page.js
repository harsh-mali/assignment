import { redirect } from 'next/navigation';

export default function HomePage() {
  // The middleware will handle logged-in users,
  // so if we reach here, we redirect to login.
  redirect('/login');
}