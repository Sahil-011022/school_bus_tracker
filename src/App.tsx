/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { Bus, User, MapPin, LogIn, Mail, Lock, UserPlus } from 'lucide-react';
import { db, auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User as AuthUser, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';


type Role = 'parent' | 'driver' | null;

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRole(docSnap.data().role as Role);
        } else {
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoadingAuth(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled. Please enable it in your Firebase Console.');
      } else {
        setError('Invalid email or password.');
      }
    }
  };

  const handleSignUp = async (signupRole: Role) => {
    if (!email || !password) {
      setError('Email and password required for sign up.');
      return;
    }
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), { role: signupRole });
      setRole(signupRole);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled. Please enable it in your Firebase Console.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleSetRole = async (signupRole: Role) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { role: signupRole });
      setRole(signupRole);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loadingAuth) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 relative overflow-hidden">
        {/* Splash background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-amber-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white z-10 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Bus size={32} className="text-amber-400" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter text-center">TrackSchool Pro</h1>
          
          <form onSubmit={handleLogin} className="space-y-5 mb-6">
            {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">{error}</div>}
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  placeholder="parent@school.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" className="w-full flex items-center justify-center py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition">
              <LogIn className="mr-2" size={20} /> Login
            </button>
          </form>
          
          <div className="relative flex items-center py-4 mb-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Or Create Account</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button type="button" onClick={() => handleSignUp('parent')} className="flex flex-col items-center justify-center py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:border-slate-900 hover:text-slate-900 transition font-bold shadow-sm">
              <UserPlus size={24} className="mb-2" /> Parent
            </button>
            <button type="button" onClick={() => handleSignUp('driver')} className="flex flex-col items-center justify-center py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:border-slate-900 hover:text-slate-900 transition font-bold shadow-sm">
              <Bus size={24} className="mb-2" /> Driver
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (user && !role) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Complete Your Profile</h2>
          <p className="text-slate-600 mb-8">Please select your account type to continue.</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={() => handleSetRole('parent')} className="flex flex-col items-center justify-center py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:border-slate-900 hover:text-slate-900 transition font-bold shadow-sm">
              <UserPlus size={24} className="mb-2" /> Parent
            </button>
            <button onClick={() => handleSetRole('driver')} className="flex flex-col items-center justify-center py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:border-slate-900 hover:text-slate-900 transition font-bold shadow-sm">
              <Bus size={24} className="mb-2" /> Driver
            </button>
          </div>
          <button onClick={() => signOut(auth)} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition uppercase tracking-widest">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-8 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-400 rounded-md flex items-center justify-center">
            <Bus size={20} className="text-slate-900" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TrackSchool Pro</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-slate-300 hidden sm:block">{user.email}</span>
          <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
          <button onClick={() => signOut(auth)} className="text-sm font-bold text-amber-400 hover:text-amber-300 transition uppercase tracking-widest flex items-center gap-2">
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 p-8 overflow-y-auto">
        {role === 'parent' ? <ParentInterface /> : <DriverInterface />}
      </main>
    </div>
  );
}

function ParentInterface() {
  const [searchInput, setSearchInput] = useState('');
  const [activeBusId, setActiveBusId] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!activeBusId) {
      setLocation(null);
      return;
    }
    
    setLocation(null); // Reset when changing buses until we get the new signal
    const q = query(collection(db, 'buses', activeBusId, 'locations'), orderBy('timestamp', 'desc'), limit(1));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setLocation({ lat: data.lat, lng: data.lng });
      }
    });
  }, [activeBusId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveBusId(searchInput.trim());
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 tracking-tight">Parent Dashboard</h2>
      
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="Enter Bus ID to track (e.g., bus1)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 p-4 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
        />
        <button type="submit" className="px-6 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition whitespace-nowrap">
          Track Bus
        </button>
      </form>

      {activeBusId && (
        <div className="mb-4 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Currently Tracking</span>
            <span className="text-lg font-bold text-slate-900">{activeBusId}</span>
          </div>
          <div>
            {location ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Signal
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold uppercase rounded-full">Waiting for Signal...</span>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-100 border border-slate-200 rounded-2xl h-[500px] overflow-hidden relative flex items-center justify-center">
        {location ? (
          <APIProvider apiKey={process.env.GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
            <Map defaultCenter={location} defaultZoom={15} center={location}>
              <Marker position={location} />
            </Map>
          </APIProvider>
        ) : (
          <div className="text-center p-8 max-w-md flex flex-col items-center">
            <MapPin className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">
              {activeBusId 
                ? "Waiting for live location updates from the driver. Please ensure the driver has started sharing their location." 
                : "Enter a Bus ID above to start tracking real-time location."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DriverInterface() {
  const [busId, setBusId] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!isSharing || !busId) return;

    const watcher = navigator.geolocation.watchPosition(async (pos) => {
      await addDoc(collection(db, 'buses', busId, 'locations'), {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        timestamp: serverTimestamp()
      });
    });
    return () => navigator.geolocation.clearWatch(watcher);
  }, [isSharing, busId]);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
      <h2 className="text-2xl font-bold mb-6 tracking-tight">Driver View</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Enter Bus ID (e.g., bus1)"
          value={busId}
          onChange={(e) => setBusId(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />
        <button
          onClick={() => setIsSharing(!isSharing)}
          className={`w-full p-4 rounded-xl font-bold text-white transition ${isSharing ? 'bg-red-500' : 'bg-indigo-600'}`}
        >
          {isSharing ? 'Stop Sharing' : 'Start Sharing'}
        </button>
      </div>
      {isSharing && busId && (
        <div className="mt-6 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <h3 className="text-indigo-900 font-bold mb-2">GPS Tracking Active</h3>
          <p className="text-indigo-700 text-sm">Sharing location for {busId}</p>
          <div className="mt-4 animate-pulse w-4 h-4 rounded-full bg-indigo-500"></div>
        </div>
      )}
    </div>
  );
}
