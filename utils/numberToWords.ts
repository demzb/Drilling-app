// A function to convert number to words.
// It will handle numbers up to trillions and include cents.

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    let result = '';
    if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
    }
    if (n >= 10 && n < 20) {
        result += teens[n - 10];
    } else {
        if (n >= 20) {
            result += tens[Math.floor(n / 10)];
            n %= 10;
        }
        if (n > 0) {
            result += (result ? ' ' : '') + ones[n];
        }
    }
    return result.trim();
}

export function numberToWords(num: number): string {
    if (num === 0) return 'Zero Dalasi';
    
    const dollars = Math.floor(num);
    const cents = Math.round((num - dollars) * 100);

    let dollarWords = '';
    if (dollars > 0) {
        const trillions = Math.floor(dollars / 1000000000000);
        const billions = Math.floor((dollars % 1000000000000) / 1000000000);
        const millions = Math.floor((dollars % 1000000000) / 1000000);
        const thousands = Math.floor((dollars % 1000000) / 1000);
        const remainder = dollars % 1000;

        if (trillions > 0) {
            dollarWords += convertLessThanThousand(trillions) + ' Trillion ';
        }
        if (billions > 0) {
            dollarWords += convertLessThanThousand(billions) + ' Billion ';
        }
        if (millions > 0) {
            dollarWords += convertLessThanThousand(millions) + ' Million ';
        }
        if (thousands > 0) {
            dollarWords += convertLessThanThousand(thousands) + ' Thousand ';
        }
        if (remainder > 0) {
            dollarWords += convertLessThanThousand(remainder);
        }
        
        dollarWords = dollarWords.trim() + ' Dalasi';
    }

    let centWords = '';
    if (cents > 0) {
        centWords = ' and ' + convertLessThanThousand(cents) + (cents === 1 ? ' Butut' : ' Bututs');
    }

    if (dollarWords && centWords) {
        return dollarWords + centWords;
    }
    if (dollarWords) {
        return dollarWords;
    }
    if (centWords) {
        // Handle cases like GMD 0.50
        return convertLessThanThousand(cents) + (cents === 1 ? ' Butut' : ' Bututs');
    }
    
    return 'Zero Dalasi';
}