'use strict';

import { getFoxesData } from './api.js';

function initializeShop() {
    const incomeRange = document.getElementById('income');
    const incomeValue = document.getElementById('income-value');
    const cardsContainer = document.querySelector('.cards');
    const cartContainer = document.querySelector('.card-add');
    const quantityDisplay = document.querySelector('.quantity');
    const searchInput = document.querySelector('input[type="text"]');
    const searchButton = document.querySelector('button');
    const checkoutButton = document.querySelector('.checkout');
    let cardData = [];
    let cartItemsCount = {};

    function updateIncomeValue() {
        if (incomeRange && incomeValue) {
            incomeValue.textContent = `Value: $${incomeRange.value}`;
        }
    }

    updateIncomeValue();
    incomeRange && incomeRange.addEventListener('input', function () {
        updateIncomeValue();
        filterCardsByPrice(incomeRange.value);
    });

    getFoxesData()
        .then(data => {
            cardData = data;
            if (window.location.pathname.includes('allProducts.html') || window.location.pathname.includes('products.html')) {
                displayCards();
            }
            renderFilters();
        })
        .catch(error => console.error('Error loading data:', error));

    function displayCards(filteredData) {
        cardsContainer.innerHTML = '';
        const cardsToDisplay = filteredData || cardData;

        cardsToDisplay.forEach((card, index) => {
            const cardHTML = `
                <div class="card">
                    <img src="${card.imgSrc}" alt="">
                    <button class="add-to-cart" data-index="${index}">
                        &plus;
                        <h6>Add</h6>
                    </button>
                    <div class="info">
                        <h2>${card.title}</h2>
                        <h3>${card.price}</h3>
                        <img src="${card.rating}" alt="Rating">
                        <h4>${card.description}</h4>
                    </div>
                </div>
            `;
            cardsContainer.insertAdjacentHTML('beforeend', cardHTML);
        });

        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons && addToCartButtons.forEach(button => {
            button.addEventListener('click', addToCart);
        });
    }

    function filterCardsByPrice(maxPrice, filter, search) {
        const filteredCards = cardData.filter(card => {
            const cardPrice = parseFloat(card.price.replace(/[^\d.]/g, ''));
            const isPriceValid = cardPrice <= maxPrice;
            const isCategoryValid = filter === 'all' || (filter && card.category.toLowerCase() === filter.toLowerCase()); 
            const isSearchValid = search ? card.title.toLowerCase().includes(search) || card.description.toLowerCase().includes(search) : true;
            return isCategoryValid && isSearchValid && isPriceValid;
        });
        displayCards(filteredCards);
    }

    incomeRange && incomeRange.addEventListener('input', function () {
        updateIncomeValue();
        const maxPrice = parseFloat(incomeRange.value);
        const selectedCategory = document.querySelector('.current').id;
        const search = searchInput.value.toLowerCase().trim();
        filterCardsByPrice(maxPrice, selectedCategory, search);
    });

    function addToCart(event) {
        const index = event.currentTarget.dataset.index;
        const selectedCard = cardData[index];

        const existingCartItem = cartContainer.querySelector(`.cart-item[data-index="${index}"]`);
        if (existingCartItem) {
            const numberElement = existingCartItem.querySelector('.number');
            numberElement.textContent = parseInt(numberElement.textContent) + 1;
        } else {
            const cartItemHTML = `
                <div class="cart-item" data-index="${index}">
                    <div class="info-img">
                        <img src="${selectedCard.imgSrc}" alt="">
                        <div class="information">
                            <h6>${selectedCard.title}</h6>
                            <h6 class="price">${selectedCard.price}</h6>
                        </div>
                    </div>
                    <div class="add-remove">
                        <div class="ad">
                            <button class="plus">-</button>
                            <span class="number">1</span>
                            <button class="minus">+</button>
                        </div>
                        <div class="remove">
                            <p>Remove</p>
                            <button class="cross"><img src="./img/cross.svg" alt=""></button>
                        </div>
                    </div>
                </div>
            `;

            cartContainer.insertAdjacentHTML('beforeend', cartItemHTML);
        }

        cartItemsCount[selectedCard.title] = (cartItemsCount[selectedCard.title] || 0) + 1;

        updateTotal();

        const cartItems = Object.keys(cartItemsCount);
        updateCartQuantity(cartItems.length);
    }

    function updateTotal() {
        let totalPrice = 0;
        const cartItems = document.querySelectorAll('.cart-item');

        cartItems.forEach(item => {
            const priceElement = item.querySelector('.price');
            const quantityElement = item.querySelector('.number');
            const priceWithoutDollarSign = priceElement.textContent.slice(1);
            const quantity = parseInt(quantityElement.textContent);

            totalPrice += parseFloat(priceWithoutDollarSign) * quantity;
        });

        const totalElement = document.querySelector('.total');
        if (totalElement) {
            totalElement.textContent = `Total: $${totalPrice.toFixed(2)}`;
        }
    }

    cartContainer && cartContainer.addEventListener('click', function (event) {
        const button = event.target.closest('button');
        if (!button) return;

        const cartItem = button.closest('.cart-item');
        if (!cartItem) return;

        const numberElement = cartItem.querySelector('.number');
        if (!numberElement) return;

        const quantity = parseInt(numberElement.textContent);
        if (button.classList.contains('plus')) {
            numberElement.textContent = quantity - 1;
            if (quantity === 1) {
                cartItem.remove();
                const title = cartItem.querySelector('.information h6').textContent;
                cartItemsCount[title] -= 1;
                if (cartItemsCount[title] === 0) {
                    delete cartItemsCount[title];
                }
                const cartItems = Object.keys(cartItemsCount);
                updateCartQuantity(cartItems.length);
            }
        } else if (button.classList.contains('minus')) {
            numberElement.textContent = quantity + 1;
        } else if (button.classList.contains('cross')) {
            cartItem.remove();
            const title = cartItem.querySelector('.information h6').textContent;
            cartItemsCount[title] -= 1;
            if (cartItemsCount[title] === 0) {
                delete cartItemsCount[title];
            }
            const cartItems = Object.keys(cartItemsCount);
            updateCartQuantity(cartItems.length);
        }

        updateTotal();
    });

    const defaultFilters = {
        category: 'All',
        text: '',
        price: '251', 
    };

    const filterDataByCategory = (category) => {
        return cardData.filter(el => category === defaultFilters.category ? el : el.description === category)
    }
    
    const filterDataByType = (typedText) => {
        const searchInput = document.querySelector('.search input');
        const value = typedText.toLowerCase().trim() || searchInput.value;

        return cardData.filter(el => el.title.toLowerCase().trim().includes(value))
    }

    const filterDataByRange = (price) => {
        const incomeValue = document.querySelector('[type=range]');
        const value = price || incomeValue.value;

        return cardData.filter(el => parseInt(el.price.slice(1)) <= value)
    }   

    const combinedFilters = (
        category = defaultFilters.category, 
        typedText = defaultFilters.text, 
        price = defaultFilters.price
    ) => {
        const filteredDataByAllFilters =  cardData.filter(el => {
            const filteredCategory = category === defaultFilters.category ? el : el.description === category; 
            const filteredPrice = parseInt(el.price.slice(1)) <= price; 
            const filteredText = el.title.toLowerCase().trim().includes(typedText.toLowerCase().trim());

            return filteredCategory && filteredText && filteredPrice
        });

        return filteredDataByAllFilters;
    }

    function renderFilters() {
        const foxFilters = document.querySelector('.topic');
        const uniqueNavCategories = ['All', ...new Set(cardData.map(category => category.description))];

        uniqueNavCategories.forEach(category => {
            console.log(category)
            const filterHTML = `<li><a href="#" data-category="${category}">${category}</a></li>`;

            foxFilters.insertAdjacentHTML('beforeend', filterHTML);
    
            const filterAnchor = foxFilters.querySelector(`[data-category=${category}]`);

            filterAnchor.addEventListener('click', (event) => {
                event.preventDefault();
                const incomeValue = document.querySelector('[type=range]');
                const searchInput = document.querySelector('.search input');

                const filterCategory = event.target.dataset.category;
                const filteredCategories = combinedFilters(filterCategory, searchInput.value, incomeValue.value);
                console.log(event.target, filterCategory, filteredCategories)

                if (!filteredCategories) return;
    
                // const filteredCards = cardData.filter(filteredCategories);
    
                displayCards(filteredCategories);
    
                const allFilters = document.querySelectorAll('.topic li a');
                allFilters.forEach(item => item.classList.remove('current'));
    
                event.target.classList.add('current');
            });
        })
    
        const firstFilter = foxFilters.querySelector('li:first-child a');

        firstFilter.classList.add('current');
    }
    
    const currentPageUrl = window.location.href;

    const menuLinks = document.querySelectorAll('.navigation-list a');

    menuLinks.forEach(link => {
        if (link.href === currentPageUrl) {
            link.classList.add('active');
        }
    });

    function searchCards(filter) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredCards = cardData.filter(card => {
            const isCategoryValid = filter === 'all' || (typeof filter === 'string' && card.category.toLowerCase() === filter.toLowerCase()); // Додано перевірку на тип даних
            return isCategoryValid && (card.title.toLowerCase().includes(searchTerm) || card.description.toLowerCase().includes(searchTerm));
        });
        displayCards(filteredCards);
    }
    
    searchInput && searchInput.addEventListener('input', function () {
        const selectedCategory = document.querySelector('.current').id;
        searchCards(selectedCategory);
    });

    searchInput && searchInput.addEventListener('input', searchCards);
    searchButton && searchButton.addEventListener('click', searchCards);

    function placeOrder() {
        console.log('The order is placed');
        cartContainer.innerHTML = '';
        cartItemsCount = {}; 
        displayCards(); 
        updateTotal(); 
        localStorage.removeItem('cartItems');
        updateCartQuantity(0); 
    }
    
    
    checkoutButton && checkoutButton.addEventListener('click', placeOrder);

    function updateCartQuantity(quantity) {
        quantityDisplay.textContent = quantity;
    }

    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    cartItems.forEach(item => {
        const selectedCard = cardData.find(card => card.title === item.title && card.price === item.price);
        addToCart({
            currentTarget: {
                dataset: {
                    index: cardData.indexOf(selectedCard)
                }
            }
        });
    });

    updateCartQuantity(cartItems.length);
    updateTotal();
}

document.addEventListener('DOMContentLoaded', initializeShop);

// 'use strict';

// import { getFoxesData } from './api.js';

// function initializeShop() {
//     const incomeRange = document.getElementById('income');
//     const incomeValue = document.getElementById('income-value');
//     const cardsContainer = document.querySelector('.cards');
//     const cartContainer = document.querySelector('.card-add');
//     const quantityDisplay = document.querySelector('.quantity');
//     const searchInput = document.querySelector('input[type="text"]');
//     const searchButton = document.querySelector('button');
//     const checkoutButton = document.querySelector('.checkout');
//     let cardData = [];
//     let cartItemsCount = {};

//     function updateIncomeValue() {
//         if (incomeRange && incomeValue) {
//             incomeValue.textContent = `Value: $${incomeRange.value}`;
//         }
//     }

//     updateIncomeValue();
//     incomeRange && incomeRange.addEventListener('input', function () {
//         updateIncomeValue();
//         filterCardsByPrice(incomeRange.value);
//     });

//     getFoxesData()
//         .then(data => {
//             cardData = data;
//             if (window.location.pathname.includes('allProducts.html') || window.location.pathname.includes('products.html')) {
//                 displayCards();
//             }
//             renderFilters();
//         })
//         .catch(error => console.error('Error loading data:', error));

//     function displayCards(filteredData) {
//         cardsContainer.innerHTML = '';
//         const cardsToDisplay = filteredData || cardData;

//         cardsToDisplay.forEach((card, index) => {
//             const cardHTML = `
//                 <div class="card">
//                     <img src="${card.imgSrc}" alt="">
//                     <button class="add-to-cart" data-index="${index}">
//                         &plus;
//                         <h6>Add</h6>
//                     </button>
//                     <div class="info">
//                         <h2>${card.title}</h2>
//                         <h3>${card.price}</h3>
//                         <img src="${card.rating}" alt="Rating">
//                         <h4>${card.description}</h4>
//                     </div>
//                 </div>
//             `;
//             cardsContainer.insertAdjacentHTML('beforeend', cardHTML);
//         });

//         const addToCartButtons = document.querySelectorAll('.add-to-cart');
//         addToCartButtons && addToCartButtons.forEach(button => {
//             button.addEventListener('click', addToCart);
//         });
//     }

//     function filterCardsByPrice(maxPrice, filter, search) {
//         const filteredCards = cardData.filter(card => {
//             const cardPrice = parseFloat(card.price.replace(/[^\d.]/g, ''));
//             const isPriceValid = cardPrice <= maxPrice;
//             const isCategoryValid = filter === 'All' || (filter && card.description.toLowerCase() === filter.toLowerCase());
//             const isSearchValid = search ? card.title.toLowerCase().includes(search) || card.description.toLowerCase().includes(search) : true;
//             return isCategoryValid && isSearchValid && isPriceValid;
//         });
//         displayCards(filteredCards);
//     }

//     incomeRange && incomeRange.addEventListener('input', function () {
//         updateIncomeValue();
//         const maxPrice = parseFloat(incomeRange.value);
//         const selectedCategory = document.querySelector('.current').id;
//         const search = searchInput.value.toLowerCase().trim();
//         filterCardsByPrice(maxPrice, selectedCategory, search);
//     });

//     function addToCart(event) {
//         const index = event.currentTarget.dataset.index;
//         const selectedCard = cardData[index];

//         const existingCartItem = cartContainer.querySelector(`.cart-item[data-index="${index}"]`);
//         if (existingCartItem) {
//             const numberElement = existingCartItem.querySelector('.number');
//             numberElement.textContent = parseInt(numberElement.textContent) + 1;
//         } else {
//             const cartItemHTML = `
//                 <div class="cart-item" data-index="${index}">
//                     <div class="info-img">
//                         <img src="${selectedCard.imgSrc}" alt="">
//                         <div class="information">
//                             <h6>${selectedCard.title}</h6>
//                             <h6 class="price">${selectedCard.price}</h6>
//                         </div>
//                     </div>
//                     <div class="add-remove">
//                         <div class="ad">
//                             <button class="plus">-</button>
//                             <span class="number">1</span>
//                             <button class="minus">+</button>
//                         </div>
//                         <div class="remove">
//                             <p>Remove</p>
//                             <button class="cross"><img src="./img/cross.svg" alt=""></button>
//                         </div>
//                     </div>
//                 </div>
//             `;

//             cartContainer.insertAdjacentHTML('beforeend', cartItemHTML);
//         }

//         cartItemsCount[selectedCard.title] = (cartItemsCount[selectedCard.title] || 0) + 1;

//         updateTotal();

//         const cartItems = Object.keys(cartItemsCount);
//         updateCartQuantity(cartItems.length);
//     }

//     function updateTotal() {
//         let totalPrice = 0;
//         const cartItems = document.querySelectorAll('.cart-item');

//         cartItems.forEach(item => {
//             const priceElement = item.querySelector('.price');
//             const quantityElement = item.querySelector('.number');
//             const priceWithoutDollarSign = priceElement.textContent.slice(1);
//             const quantity = parseInt(quantityElement.textContent);

//             totalPrice += parseFloat(priceWithoutDollarSign) * quantity;
//         });

//         const totalElement = document.querySelector('.total');
//         if (totalElement) {
//             totalElement.textContent = `Total: $${totalPrice.toFixed(2)}`;
//         }
//     }

//     cartContainer && cartContainer.addEventListener('click', function (event) {
//         const button = event.target.closest('button');
//         if (!button) return;

//         const cartItem = button.closest('.cart-item');
//         if (!cartItem) return;

//         const numberElement = cartItem.querySelector('.number');
//         if (!numberElement) return;

//         const quantity = parseInt(numberElement.textContent);
//         if (button.classList.contains('plus')) {
//             numberElement.textContent = quantity - 1;
//             if (quantity === 1) {
//                 cartItem.remove();
//                 const title = cartItem.querySelector('.information h6').textContent;
//                 cartItemsCount[title] -= 1;
//                 if (cartItemsCount[title] === 0) {
//                     delete cartItemsCount[title];
//                 }
//                 const cartItems = Object.keys(cartItemsCount);
//                 updateCartQuantity(cartItems.length);
//             }
//         } else if (button.classList.contains('minus')) {
//             numberElement.textContent = quantity + 1;
//         } else if (button.classList.contains('cross')) {
//             cartItem.remove();
//             const title = cartItem.querySelector('.information h6').textContent;
//             cartItemsCount[title] -= 1;
//             if (cartItemsCount[title] === 0) {
//                 delete cartItemsCount[title];
//             }
//             const cartItems = Object.keys(cartItemsCount);
//             updateCartQuantity(cartItems.length);
//         }

//         updateTotal();
//     });

//     const defaultFilters = {
//         category: 'All',
//         text: '',
//         price: '251', 
//     };

//     const filterDataByCategory = (category) => {
//         return cardData.filter(el => category === 'All' || el.description === category);
//     }

//     const filterDataByType = (typedText) => {
//         const value = typedText.toLowerCase().trim();
//         return cardData.filter(el => el.title.toLowerCase().includes(value) || el.description.toLowerCase().includes(value));
//     }

//     const filterDataByRange = (price) => {
//         const value = parseFloat(price);
//         return cardData.filter(el => parseFloat(el.price.slice(1)) <= value);
//     }


//     const combinedFilters = (
//         category = defaultFilters.category, 
//         typedText = defaultFilters.text, 
//         price = defaultFilters.price
//     ) => {
//         const filteredDataByAllFilters =  cardData.filter(el => {
//             const filteredCategory = category === 'All' || el.description === category; 
//             const filteredPrice = parseFloat(el.price.slice(1)) <= price; 
//             const filteredText = el.title.toLowerCase().includes(typedText.toLowerCase().trim());

//             return filteredCategory && filteredText && filteredPrice
//         });

//         return filteredDataByAllFilters;
//     }

//     function renderFilters() {
//         const foxFilters = document.querySelector('.topic');
//         const uniqueNavCategories = ['All', ...new Set(cardData.map(category => category.description))];

//         uniqueNavCategories.forEach(category => {
//             const filterHTML = `<li><a href="#" data-category="${category}">${category}</a></li>`;

//             foxFilters.insertAdjacentHTML('beforeend', filterHTML);
    
//             const filterAnchor = foxFilters.querySelector(`[data-category=${category}]`);

//             filterAnchor.addEventListener('click', (event) => {
//                 event.preventDefault();
//                 const incomeValue = document.querySelector('[type=range]');
//                 const searchInput = document.querySelector('.search input');

//                 const filterCategory = event.target.dataset.category;
//                 const filteredCategories = combinedFilters(filterCategory, searchInput.value, incomeValue.value);

//                 if (!filteredCategories) return;
    
//                 displayCards(filteredCategories);
    
//                 const allFilters = document.querySelectorAll('.topic li a');
//                 allFilters.forEach(item => item.classList.remove('current'));
    
//                 event.target.classList.add('current');
//             });
//         })
    
//         const firstFilter = foxFilters.querySelector('li:first-child a');

//         firstFilter.classList.add('current');
//     }
    
//     const currentPageUrl = window.location.href;

//     const menuLinks = document.querySelectorAll('.navigation-list a');

//     menuLinks.forEach(link => {
//         if (link.href === currentPageUrl) {
//             link.classList.add('active');
//         }
//     });

//     function searchCards(filter) {
//         const searchTerm = searchInput.value.toLowerCase().trim();
//         const filteredCards = cardData.filter(card => {
//             const isCategoryValid = filter === 'All' || (typeof filter === 'string' && card.description.toLowerCase() === filter.toLowerCase());
//             return isCategoryValid && (card.title.toLowerCase().includes(searchTerm) || card.description.toLowerCase().includes(searchTerm));
//         });
//         displayCards(filteredCards);
//     }
    
//     searchInput && searchInput.addEventListener('input', function () {
//         const selectedCategory = document.querySelector('.current').id;
//         searchCards(selectedCategory);
//     });

//     searchInput && searchInput.addEventListener('input', searchCards);
//     searchButton && searchButton.addEventListener('click', searchCards);

//     function placeOrder() {
//         console.log('The order is placed');
//         cartContainer.innerHTML = '';
//         cartItemsCount = {}; 
//         displayCards(); 
//         updateTotal(); 
//         localStorage.removeItem('cartItems');
//         updateCartQuantity(0); 
//     }
    
    
//     checkoutButton && checkoutButton.addEventListener('click', placeOrder);

//     function updateCartQuantity(quantity) {
//         quantityDisplay.textContent = quantity;
//     }

//     const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
//     cartItems.forEach(item => {
//         const selectedCard = cardData.find(card => card.title === item.title && card.price === item.price);
//         addToCart({
//             currentTarget: {
//                 dataset: {
//                     index: cardData.indexOf(selectedCard)
//                 }
//             }
//         });
//     });

//     updateCartQuantity(cartItems.length);
//     updateTotal();
// }

// document.addEventListener('DOMContentLoaded', initializeShop);
