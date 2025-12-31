import React, { createContext, useContext, useState, ReactNode } from 'react';

type TempUnit = 'C' | 'F';

interface TemperatureContextType {
  unit: TempUnit;
  toggleUnit: () => void;
  convertTemp: (celsius: number) => number;
  formatTemp: (celsius: number) => string;
}

const TemperatureContext = createContext<TemperatureContextType | undefined>(undefined);

export const TemperatureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unit, setUnit] = useState<TempUnit>('C');

  const toggleUnit = () => {
    setUnit(prev => prev === 'C' ? 'F' : 'C');
  };

  const convertTemp = (celsius: number): number => {
    if (unit === 'F') {
      return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(celsius);
  };

  const formatTemp = (celsius: number): string => {
    const temp = convertTemp(celsius);
    return `${temp}°${unit}`;
  };

  return (
    <TemperatureContext.Provider value={{ unit, toggleUnit, convertTemp, formatTemp }}>
      {children}
    </TemperatureContext.Provider>
  );
};

export const useTemperature = (): TemperatureContextType => {
  const context = useContext(TemperatureContext);
  if (!context) {
    throw new Error('useTemperature must be used within a TemperatureProvider');
  }
  return context;
};
