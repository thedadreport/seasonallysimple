'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    dietaryRestrictions: [] as string[],
    favoriteCuisines: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // For development, always treat as authenticated
    const isDevelopmentMode = process.env.NODE_ENV === 'development';
    
    if (isDevelopmentMode) {
      // Mock user data for development
      setFormData({
        name: 'Development User',
        firstName: 'Development',
        lastName: 'User',
        email: 'dev@example.com',
        dietaryRestrictions: ['Vegetarian'],
        favoriteCuisines: ['Italian', 'Mexican'],
      });
      setIsLoading(false);
      return;
    }
    
    // Normal authentication flow for production
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      // Initialize form data with user info
      setFormData({
        name: session.user.name || '',
        firstName: '',  // We'll fetch this from API in real implementation
        lastName: '',   // We'll fetch this from API in real implementation
        email: session.user.email || '',
        dietaryRestrictions: [],  // Mock data, would come from API
        favoriteCuisines: [],     // Mock data, would come from API
      });
      setIsLoading(false);
    }
  }, [status, router, session]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-md">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-navy mb-2">
            Your Profile
          </h1>
          <p className="text-gray-600">
            Manage your account and personalize your recipe preferences
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-32 h-32 mx-auto rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-32 h-32 mx-auto rounded-full bg-sage text-white flex items-center justify-center mb-4">
                  <span className="text-5xl font-medium">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <h2 className="text-xl font-medium text-navy mb-1">
                {session?.user?.name || 'User'}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                {session?.user?.email}
              </p>

              <button 
                onClick={() => setIsEditing(true)}
                className="btn-primary w-full"
              >
                Edit Profile
              </button>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            {isEditing ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-serif font-semibold text-navy">
                    Edit Your Profile
                  </h2>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setIsSaving(true);
                  // Mock API call to update profile
                  setTimeout(() => {
                    setIsEditing(false);
                    setIsSaving(false);
                    alert('Profile updated successfully!');
                  }, 1000);
                }}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-navy font-medium mb-2">
                        First Name
                      </label>
                      <input 
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-navy font-medium mb-2">
                        Last Name
                      </label>
                      <input 
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-navy font-medium mb-2">
                        Email
                      </label>
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full input-field"
                        disabled={!!(session?.user?.email && session.user.email.includes('@'))}
                      />
                      {session?.user?.email && session.user.email.includes('@') && 
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed for social login accounts</p>
                      }
                    </div>
                    
                    <div>
                      <label className="block text-navy font-medium mb-2">
                        Display Name
                      </label>
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full input-field"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium text-navy mb-3 mt-4">
                        Recipe Preferences
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-navy font-medium mb-2">
                            Dietary Restrictions
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Keto', 'Paleo'].map(diet => (
                              <button
                                key={diet}
                                type="button"
                                onClick={() => {
                                  const currentRestrictions = [...formData.dietaryRestrictions];
                                  if (currentRestrictions.includes(diet)) {
                                    setFormData({
                                      ...formData,
                                      dietaryRestrictions: currentRestrictions.filter(d => d !== diet)
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      dietaryRestrictions: [...currentRestrictions, diet]
                                    });
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm ${
                                  formData.dietaryRestrictions.includes(diet)
                                    ? 'bg-sage text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {diet}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-navy font-medium mb-2">
                            Favorite Cuisines
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {['Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 'Indian', 'French'].map(cuisine => (
                              <button
                                key={cuisine}
                                type="button"
                                onClick={() => {
                                  const currentCuisines = [...formData.favoriteCuisines];
                                  if (currentCuisines.includes(cuisine)) {
                                    setFormData({
                                      ...formData,
                                      favoriteCuisines: currentCuisines.filter(c => c !== cuisine)
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      favoriteCuisines: [...currentCuisines, cuisine]
                                    });
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm ${
                                  formData.favoriteCuisines.includes(cuisine)
                                    ? 'bg-sage text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {cuisine}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8">
                        <button 
                          type="submit"
                          className="btn-primary w-full md:w-auto"
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-serif font-semibold text-navy">
                  Account Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-navy font-medium mb-2">
                      Email
                    </label>
                    <div className="border border-gray-300 rounded-md px-4 py-2.5 bg-gray-50">
                      {session?.user?.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-navy font-medium mb-2">
                      Name
                    </label>
                    <div className="border border-gray-300 rounded-md px-4 py-2.5 bg-gray-50">
                      {session?.user?.name || 'Not set'}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium text-navy mb-3 mt-4">
                      Recipe Preferences
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Set your recipe preferences to personalize your experience
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-navy font-medium mb-2">
                          Dietary Restrictions
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {formData.dietaryRestrictions.length > 0 ? (
                            formData.dietaryRestrictions.map(diet => (
                              <span key={diet} className="bg-sage bg-opacity-10 text-sage px-3 py-1 rounded-full text-sm">
                                {diet}
                              </span>
                            ))
                          ) : (
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                              None set
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-navy font-medium mb-2">
                          Favorite Cuisines
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {formData.favoriteCuisines.length > 0 ? (
                            formData.favoriteCuisines.map(cuisine => (
                              <span key={cuisine} className="bg-sage bg-opacity-10 text-sage px-3 py-1 rounded-full text-sm">
                                {cuisine}
                              </span>
                            ))
                          ) : (
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                              None set
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 border border-sage text-sage rounded-lg hover:bg-sage hover:bg-opacity-10 transition"
                      >
                        Edit Preferences
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}