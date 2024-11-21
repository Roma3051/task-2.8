// export const getFoxesData = () => {
//      fetch('data.json')
//     .then(response => response.json())
//     .then(data => data)
//     .catch(error => console.error('Error loading data:', error))
// }


// export const getFoxesData = () => {
//     return fetch('/data.json')
//         .then(response => response.json())
//         .catch(error => console.error('Error loading data:', error))
// }

export const getFoxesData = () => {
    return fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            throw error; 
        });
}
