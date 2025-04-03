import React from 'react';

// Composant TabsList
const TabsList = ({ children, className = '' }) => {
    return (
        <div className={`flex border-b border-gray-200 ${className}`}>
            {children}
        </div>
    );
};

// Composant TabsTrigger
const TabsTrigger = ({ children, value, className = '', ...props }) => {
    const isActive = props.value === value;

    return (
        <button
            className={`py-2 px-4 font-medium text-sm ${isActive
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${className}`}
            onClick={() => props.onValueChange?.(value)}
            {...props}
        >
            {children}
        </button>
    );
};

// Composant TabsContent
const TabsContent = ({ children, value, className = '', ...props }) => {
    const isActive = props.value === value;

    if (!isActive) return null;

    return (
        <div className={className} {...props}>
            {children}
        </div>
    );
};

// Composant Tabs principal
const Tabs = ({ children, defaultValue, value, onValueChange, className = '', ...props }) => {
    // Si value et onValueChange sont fournis, c'est un composant contrôlé
    // Sinon, il faudrait gérer l'état en interne

    return (
        <div className={`w-full ${className}`} {...props}>
            {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child;

                return React.cloneElement(child, {
                    value,
                    onValueChange,
                    defaultValue,
                });
            })}
        </div>
    );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };