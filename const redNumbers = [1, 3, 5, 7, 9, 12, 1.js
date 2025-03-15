const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
let numbers = [];

function addNumber() {
    const input = document.getElementById('numberInput');
    const number = parseInt(input.value);
    
    if (number >= 0 && number <= 36) {
        numbers.push(number);
        updateDisplay();
        checkAlternances();
        input.value = '';
    }
}

function getNumberProperties(num) {
    return {
        color: redNumbers.includes(num) ? 'red' : 'black',
        evenOdd: num % 2 === 0 ? 'pair' : 'impair',
        passManque: num >= 19 ? 'passe' : 'manque'
    };
}

function updateDisplay() {
    const container = document.getElementById('results-container');
    container.innerHTML = '';
    
    numbers.forEach(num => {
        const props = getNumberProperties(num);
        const box = document.createElement('div');
        box.className = `number-box ${props.color}`;
        box.innerHTML = `
            <div>${num}</div>
            <div>${props.evenOdd}</div>
            <div>${props.passManque}</div>
        `;
        container.appendChild(box);
    });

    updateLastSeen();
}

function updateLastSeen() {
    const lastNumber = numbers[numbers.length - 1];
    if (lastNumber === undefined) return;

    const lastSeenDiv = document.getElementById('lastSeen');
    const previousOccurrence = numbers.slice(0, -1).lastIndexOf(lastNumber);
    
    if (previousOccurrence === -1) {
        lastSeenDiv.textContent = `Première apparition du ${lastNumber}`;
    } else {
        const tours = numbers.length - previousOccurrence - 1;
        lastSeenDiv.textContent = `${lastNumber} vu il y a ${tours} tours`;
    }
}

function checkAlternances() {
    const sequences = {
        color: [],
        evenOdd: [],
        passManque: []
    };

    numbers.forEach(num => {
        const props = getNumberProperties(num);
        sequences.color.push(props.color);
        sequences.evenOdd.push(props.evenOdd);
        sequences.passManque.push(props.passManque);
    });

    const alternances = document.getElementById('alternances');
    alternances.innerHTML = '';

    ['color', 'evenOdd', 'passManque'].forEach(type => {
        const sequence = sequences[type];
        let count = 1;
        let isAlternating = true;

        for (let i = sequence.length - 1; i > sequence.length - 7 && i > 0; i--) {
            if (sequence[i] === sequence[i-1]) {
                isAlternating = false;
                break;
            }
            count++;
        }

        if (count >= 6 && isAlternating) {
            const message = `Alternance de ${count} ${type === 'color' ? 'rouge/noir' : 
                type === 'evenOdd' ? 'pair/impair' : 'passe/manque'} détectée!`;
            alert(message);
            alternances.innerHTML += `<div>${message}</div>`;
        }
    });
}
