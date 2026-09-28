/**
 * Clerk Authentication Examples
 * Useful patterns for using Clerk in React components
 */

import { useAuth, useUser, useClerk, useSession } from '@clerk/clerk-react';

/**
 * Example 1: Get and Display Current User
 */
export function UserProfile() {
  const { user } = useUser();

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>{user.firstName} {user.lastName}</h2>
      <p>{user.primaryEmailAddress?.emailAddress}</p>
      <img src={user.imageUrl} alt="Profile" />
      <p>Created: {user.createdAt?.toLocaleDateString()}</p>
    </div>
  );
}

/**
 * Example 2: Make Authenticated API Calls
 */
export function PatientPrediction() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predictSepsis = async (patientData) => {
    try {
      setLoading(true);
      setError(null);

      // Get the JWT token from Clerk
      const token = await getToken();

      const response = await fetch('/api/v1/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => predictSepsis({ /* data */ })}>
        {loading ? 'Predicting...' : 'Predict Risk'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

/**
 * Example 3: Fetch Protected Data
 */
export function PatientsList() {
  const { getToken } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/v1/patients', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setPatients(data);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [getToken]);

  if (loading) return <div>Loading patients...</div>;

  return (
    <ul>
      {patients.map(patient => (
        <li key={patient.id}>{patient.name}</li>
      ))}
    </ul>
  );
}

/**
 * Example 4: Check Authentication Status
 */
export function ProtectedComponent() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <div>Loading authentication...</div>;

  return (
    <div>
      {isSignedIn ? (
        <p>You are authenticated</p>
      ) : (
        <p>Please sign in to continue</p>
      )}
    </div>
  );
}

/**
 * Example 5: Get Session Information
 */
export function SessionInfo() {
  const { session } = useSession();

  if (!session) return <div>No active session</div>;

  return (
    <div>
      <p>Session ID: {session.id}</p>
      <p>User ID: {session.userId}</p>
      <p>Status: {session.status}</p>
      <p>Created: {new Date(session.createdAt).toLocaleString()}</p>
    </div>
  );
}

/**
 * Example 6: Logout Handler
 */
export function LogoutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut(() => {
        // Optional: handle logout side effects
        console.log('User logged out');
      })}
    >
      Sign Out
    </button>
  );
}

/**
 * Example 7: Make API Call with Error Handling
 */
export function withAuthentication(fetchFn) {
  return async (token) => {
    try {
      const response = await fetch(fetchFn.url, {
        method: fetchFn.method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...fetchFn.headers,
        },
        body: fetchFn.body ? JSON.stringify(fetchFn.body) : undefined,
      });

      if (response.status === 401) {
        // Token expired or invalid
        throw new Error('Session expired. Please sign in again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };
}

/**
 * Example 8: Custom Hook - useAuthenticatedFetch
 */
export function useAuthenticatedFetch() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWithAuth = useCallback(async (url, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  return { fetchWithAuth, loading, error };
}

/**
 * Example 9: Use Custom Hook in Component
 */
export function DashboardWithHook() {
  const { fetchWithAuth, loading, error } = useAuthenticatedFetch();

  const loadAnalytics = async () => {
    try {
      const data = await fetchWithAuth('/api/v1/analytics');
      console.log('Analytics:', data);
    } catch (err) {
      console.error('Failed to load analytics');
    }
  };

  return (
    <div>
      <button onClick={loadAnalytics} disabled={loading}>
        {loading ? 'Loading...' : 'Load Analytics'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

/**
 * Example 10: Conditional Rendering Based on User Metadata
 */
export function RoleBasedComponent() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const isDoctor = user?.publicMetadata?.role === 'doctor';

  return (
    <div>
      {isAdmin && <div>Admin Dashboard</div>}
      {isDoctor && <div>Doctor Portal</div>}
      {!isAdmin && !isDoctor && <div>Patient View</div>}
    </div>
  );
}

/**
 * Usage in components:
 * 
 * import { useAuthenticatedFetch } from './clerkExamples';
 * 
 * function MyComponent() {
 *   const { fetchWithAuth, loading } = useAuthenticatedFetch();
 *   
 *   const getData = async () => {
 *     const data = await fetchWithAuth('/api/v1/data');
 *     // Use data...
 *   };
 * }
 */

export default {
  UserProfile,
  PatientPrediction,
  PatientsList,
  ProtectedComponent,
  SessionInfo,
  LogoutButton,
  useAuthenticatedFetch,
  DashboardWithHook,
};
