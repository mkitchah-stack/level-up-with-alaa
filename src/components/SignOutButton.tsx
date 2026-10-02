import { Icon } from '@/components/Icon';

export function SignOutButton({ className = '' }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className={className || 'btn-ghost btn-sm'}>
        <Icon name="logout" className="h-4 w-4" /> تسجيل الخروج
      </button>
    </form>
  );
}
