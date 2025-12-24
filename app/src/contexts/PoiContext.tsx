import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Poi } from '../types/poi';
import { PoiService } from '../services/poiService';

interface PoiContextType {
  pois: Poi[];
  addPoi: (poi: Omit<Poi, 'id'>) => Promise<void>;
  deletePoi: (id: string) => Promise<void>;
  loading: boolean;
}

const PoiContext = createContext<PoiContextType | undefined>(undefined);

export const PoiProvider = ({ children }: { children: ReactNode }) => {
  const [pois, setPois] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = PoiService.subscribePois((data) => {
      setPois(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addPoi = async (poi: Omit<Poi, 'id'>) => {
    await PoiService.addPoi(poi);
  };

  const deletePoi = async (id: string) => {
    await PoiService.deletePoi(id);
  };

  return (
    <PoiContext.Provider value={{ pois, addPoi, deletePoi, loading }}>
      {children}
    </PoiContext.Provider>
  );
};

export const usePoi = () => {
  const context = useContext(PoiContext);
  if (!context) {
    throw new Error('usePoi must be used within a PoiProvider');
  }
  return context;
};
