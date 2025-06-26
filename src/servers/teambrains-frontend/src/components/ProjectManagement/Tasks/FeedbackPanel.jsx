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
const TabsTrigger = ({ children, value: triggerValue, className = '', currentValue, onValueChange, ...props }) => {
    const isActive = currentValue === triggerValue;

    return (
        <button
            className={`py-2 px-4 font-medium text-sm ${isActive
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${className}`}
            onClick={() => onValueChange?.(triggerValue)}
            type="button"
        >
            {children}
        </button>
    );
};

// Composant TabsContent
const TabsContent = ({ children, value: contentValue, className = '', currentValue, ...props }) => {
    const isActive = currentValue === contentValue;

    if (!isActive) return null;

    return (
        <div className={className}>
            {children}
        </div>
    );
};

// Composant Tabs principal
const Tabs = ({ children, defaultValue, value, onValueChange, className = '', ...props }) => {
    return (
        <div className={`w-full ${className}`}>
            {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child;

                return React.cloneElement(child, {
                    currentValue: value,
                    onValueChange,
                    defaultValue,
                });
            })}
        </div>
    );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };