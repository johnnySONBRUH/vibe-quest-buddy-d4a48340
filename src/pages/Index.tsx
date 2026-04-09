import { useAuth } from '@/hooks/useAuth';
import Auth from './Auth';
import Dashboard from './Dashboard';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
};

export default Index;
