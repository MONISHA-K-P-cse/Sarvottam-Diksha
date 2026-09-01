import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState({
    appName: 'Sarvottam Diksha',
    tagline: 'Delve in concepts with MANIKA',
    logoUrl: '/logo.png',
    primaryColor: '#EA580C',
    secondaryColor: '#65A30D',
    contactEmail: 'Dikshasarvottam@gmail.com',
    contactPhone: '+91 99646 77802',
    address: 'Sarvottam Diksha Learning Center, India'
  });
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const res = await axios.get('/api/branding');
      if (res.data.success && res.data.settings) {
        setBranding(res.data.settings);
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, setBranding, fetchBranding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
