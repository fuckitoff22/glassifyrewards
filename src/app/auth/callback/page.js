const router = useRouter();

const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {

  // 🔥 LISTEN FIRST (IMPORTANT)
  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        router.replace("/login");
      }
    }
  );

  // 🔥 SMALL DELAY TO WAIT FOR SESSION
  setTimeout(async () => {
    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user ?? null;

    setUser(currentUser);
    setLoading(false);

    if (!currentUser) {
      router.replace("/login");
    }
  }, 300); // ✅ key fix

  return () => listener.subscription.unsubscribe();

}, []);
  return (
    <div className="h-screen flex items-center justify-center">
      Logging you in...
    </div>
  );
}
