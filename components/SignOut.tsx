import { supabase } from '../lib/supabase-client';

export default function SignOut() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full bg-red-500 hover:bg-red-600 text-white px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[42px]"
    >
      Sign Out
    </button>
  );
} 