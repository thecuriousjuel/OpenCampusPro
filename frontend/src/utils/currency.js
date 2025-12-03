/**
 * Format number as Indian Rupee currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., ₹1,23,456)
 */
export const formatINR = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '₹0';
    }

    const numAmount = Number(amount);

    // Convert to string and split into integer and decimal parts
    const [integerPart, decimalPart] = numAmount.toFixed(2).split('.');

    // Indian numbering system: last 3 digits, then groups of 2
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);

    if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
    }

    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

    // Return with or without decimals based on whether there are non-zero decimals
    if (decimalPart && decimalPart !== '00') {
        return `₹${formatted}.${decimalPart}`;
    }

    return `₹${formatted}`;
};

/**
 * Format number as compact INR (e.g., ₹1.2L, ₹1.5Cr)
 * @param {number} amount - Amount to format
 * @returns {string} Compact formatted currency string
 */
export const formatINRCompact = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '₹0';
    }

    const numAmount = Number(amount);

    if (numAmount >= 10000000) { // 1 Crore or more
        return `₹${(numAmount / 10000000).toFixed(2)}Cr`;
    } else if (numAmount >= 100000) { // 1 Lakh or more
        return `₹${(numAmount / 100000).toFixed(2)}L`;
    } else if (numAmount >= 1000) { // 1 Thousand or more
        return `₹${(numAmount / 1000).toFixed(2)}K`;
    }

    return formatINR(numAmount);
};
