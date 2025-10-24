
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Все еще загружается

    if (!session) {
      // Не авторизован - редирект на страницу входа
      router.push('/auth/signin');
      return;
    }

    if (requireAdmin && !session.user.isAdmin) {
      // Требуется админ, но пользователь не админ
      router.push('/');
      return;
    }
  }, [session, status, router, requireAdmin]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Перенаправление на страницу входа...</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !session.user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Доступ запрещен. Требуются права администратора.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}