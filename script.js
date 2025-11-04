// Helper function to generate a unique ID
const generateID = () => Math.random().toString(36).substring(2, 10).toUpperCase();
        
// Helper function to format date
const formatDate = (date) => new Date(date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const navLinks = document.querySelectorAll('.nav-link');
    const contentPages = document.querySelectorAll('.content-page');
    const pageTitle = document.getElementById('page-title');
    
    // Deposit functionality elements
    const depositBtn = document.getElementById('deposit-btn');
    const depositModal = document.getElementById('deposit-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const confirmDepositBtn = document.getElementById('confirm-deposit-btn');
    const depositAmountInput = document.getElementById('deposit-amount-input');
    const modalMessage = document.getElementById('modal-message');

    // Withdraw functionality elements
    const withdrawBtn = document.getElementById('withdraw-btn');
    const withdrawModal = document.getElementById('withdraw-modal');
    const closeWithdrawModalBtn = document.getElementById('close-withdraw-modal-btn');
    const confirmWithdrawBtn = document.getElementById('confirm-withdraw-btn');
    const withdrawAmountInput = document.getElementById('withdraw-amount-input');
    const withdrawPasswordInput = document.getElementById('withdraw-password-input');
    const withdrawMessage = document.getElementById('withdraw-message');

    // Trading functionality elements
    const tradingAmountInput = document.getElementById('amount');
    const tradingTotalInput = document.getElementById('total');
    const tradingBuyBtn = document.getElementById('buy-btn'); 
    const tradingMessage = document.getElementById('trading-message');
    
    // Balance display elements
    const dashboardBalance = document.getElementById('dashboard-balance');
    const walletBalance = document.getElementById('wallet-balance');
    const tradingBalance = document.getElementById('trading-balance');

    // History elements
    const historyTableBody = document.getElementById('history-table-body');
    const dashboardActivityBody = document.getElementById('dashboard-activity-body');

    // Global state
    let balance = 0;
    let transactions = [];
    const ADMIN_PASSWORD = 'admin123';
    
    // Telegram Web App check
    const isTWA = window.Telegram && window.Telegram.WebApp;
    
    if (isTWA) {
        // Initialize TWA
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        Telegram.WebApp.setHeaderColor('#171624'); 
        Telegram.WebApp.setBackgroundColor('#0d0c1d'); 
        console.log("Running inside Telegram Web App.");

        // Hide the main buy button as we'll use the native TWA MainButton
        if (tradingBuyBtn) tradingBuyBtn.classList.add('hidden');
    }

    // --- Core Logic Functions ---

    const updateBalances = () => {
        dashboardBalance.textContent = `$${balance.toFixed(2)}`;
        walletBalance.textContent = `$${balance.toFixed(2)}`;
        tradingBalance.textContent = `$${balance.toFixed(2)}`;
    };

    const renderTransactions = () => {
        const historyHtml = transactions.map(tx => {
            const statusClass = tx.status === 'Completed' ? 'text-green-400' : 
                                tx.status === 'Pending' ? 'text-yellow-400' : 'text-red-400';
            const typeClass = tx.type === 'DEPOSIT' ? 'bg-green-600/20 text-green-400' : 
                              tx.type === 'TRADE' ? 'bg-purple-600/20 text-purple-400' : 'bg-red-600/20 text-red-400';
            const sign = tx.type === 'DEPOSIT' ? '+' : '-';
            
            return `
                <tr>
                    <td class="py-3 px-1">${tx.id}</td>
                    <td class="py-3 px-1 text-gray-400">${formatDate(tx.date)}</td>
                    <td class="py-3 px-1">BTC/USD</td>
                    <td class="py-3 px-1">
                        <span class="text-xs font-medium px-2 py-1 rounded-full ${typeClass}">${tx.type}</span>
                    </td>
                    <td class="py-3 px-1 font-semibold">${sign}$${tx.amount.toFixed(2)}</td>
                    <td class="py-3 px-1 ${statusClass}">${tx.status}</td>
                </tr>
            `;
        }).join('');

        if (historyTableBody) {
            historyTableBody.innerHTML = transactions.length > 0 ? historyHtml : 
                '<tr><td colspan="6" class="py-8 text-center text-gray-500">No transaction history to display.</td></tr>';
        }
        
        // Render limited history on dashboard
        const dashboardHistoryHtml = transactions.slice(0, 5).map(tx => {
            const statusClass = tx.status === 'Completed' ? 'text-green-400' : tx.status === 'Pending' ? 'text-yellow-400' : 'text-red-400';
            return `
                <tr>
                    <td class="py-3 px-1 text-gray-400">${tx.id.substring(0, 6)}...</td>
                    <td class="py-3 px-1">Buy</td>
                    <td class="py-3 px-1">$${tx.amount.toFixed(2)}</td>
                    <td class="py-3 px-1">\$0.00</td>
                    <td class="py-3 px-1 ${statusClass}">${tx.status}</td>
                </tr>
            `;
        }).join('');

        if (dashboardActivityBody) {
            dashboardActivityBody.innerHTML = transactions.length > 0 ? dashboardHistoryHtml : 
                '<tr><td colspan="5" class="py-8 text-center text-gray-500">No trading activity found.</td></tr>';
        }
    };
    
    // --- UI & Navigation Logic ---
    
    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
    });

    document.addEventListener('click', (event) => {
        if (window.innerWidth < 1024 && !sidebar.contains(event.target) && !openSidebarBtn.contains(event.target)) {
            sidebar.classList.add('-translate-x-full');
        }
    });

    const navigateTo = (pageId, linkElement) => {
         // Remove active class from all links and add to clicked one
        navLinks.forEach(item => item.classList.remove('active-link', 'text-white'));
        if (linkElement) linkElement.classList.add('active-link', 'text-white');

        // Hide all content pages
        contentPages.forEach(page => page.classList.add('hidden'));

        // Show the selected page
        const selectedPage = document.getElementById(pageId + '-page');
        selectedPage.classList.remove('hidden');

        // Update the mobile page title
        const linkText = linkElement ? linkElement.textContent.trim() : pageId.charAt(0).toUpperCase() + pageId.slice(1);
        if (pageTitle) {
            pageTitle.textContent = linkText;
        }
        
        // TWA Main Button Toggle
        if (isTWA) {
            if (pageId === 'trading') {
                Telegram.WebApp.MainButton.setText('PLACE TRADE').setParams({ color: Telegram.WebApp.themeParams.button_color || '#16a34a' }).show();
                Telegram.WebApp.MainButton.onClick(() => {
                    tradingBuyBtn.click();
                });
            } else if (pageId === 'wallet') {
                Telegram.WebApp.MainButton.hide();
            } else {
                Telegram.WebApp.MainButton.hide();
            }
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo(link.dataset.page, link);
        });
    });

    // --- Modal and Transaction Logic ---

    depositBtn.addEventListener('click', () => {
        depositModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        depositModal.classList.add('hidden');
    });
        
    confirmDepositBtn.addEventListener('click', () => {
        const depositAmount = parseFloat(depositAmountInput.value);
        if (!isNaN(depositAmount) && depositAmount >= 50) {
            balance += depositAmount;
            
            transactions.unshift({
                id: generateID(),
                date: Date.now(),
                type: 'DEPOSIT',
                amount: depositAmount,
                status: 'Completed'
            });

            updateBalances();
            renderTransactions();
            depositAmountInput.value = '';
            modalMessage.textContent = `Successfully deposited $${depositAmount.toFixed(2)}!`;
            modalMessage.classList.remove('hidden', 'text-red-400');
            modalMessage.classList.add('text-green-400');
            setTimeout(() => {
                depositModal.classList.add('hidden');
                modalMessage.classList.add('hidden');
            }, 1500);
        } else {
            modalMessage.textContent = 'Minimum deposit is \$50. Please enter a valid amount.';
            modalMessage.classList.remove('hidden', 'text-green-400');
            modalMessage.classList.add('text-red-400');
        }
    });

    withdrawBtn.addEventListener('click', () => {
        withdrawModal.classList.remove('hidden');
    });

    closeWithdrawModalBtn.addEventListener('click', () => {
        withdrawModal.classList.add('hidden');
    });

    confirmWithdrawBtn.addEventListener('click', () => {
        const withdrawAmount = parseFloat(withdrawAmountInput.value);
        const enteredPassword = withdrawPasswordInput.value;

        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            withdrawMessage.textContent = 'Please enter a valid amount.';
            withdrawMessage.classList.remove('hidden', 'text-green-400');
            withdrawMessage.classList.add('text-red-400');
        } else if (withdrawAmount > balance) {
            withdrawMessage.textContent = 'Insufficient funds.';
            withdrawMessage.classList.remove('hidden', 'text-green-400');
            withdrawMessage.classList.add('text-red-400');
        } else if (enteredPassword !== ADMIN_PASSWORD) {
            withdrawMessage.textContent = 'Invalid password. Withdrawal denied.';
            withdrawMessage.classList.remove('hidden', 'text-green-400');
            withdrawMessage.classList.add('text-red-400');
        } else {
            withdrawMessage.textContent = 'Withdrawal request sent for admin approval...';
            withdrawMessage.classList.remove('hidden', 'text-red-400');
            withdrawMessage.classList.add('text-yellow-400');
            
            const pendingTx = {
                id: generateID(),
                date: Date.now(),
                type: 'WITHDRAWAL',
                amount: withdrawAmount,
                status: 'Pending'
            };
            transactions.unshift(pendingTx);
            renderTransactions();


            setTimeout(() => {
                balance -= withdrawAmount;
                
                const index = transactions.findIndex(tx => tx.id === pendingTx.id);
                if(index !== -1) {
                    transactions[index].status = 'Completed';
                }
                
                updateBalances();
                renderTransactions();

                withdrawAmountInput.value = '';
                withdrawPasswordInput.value = '';
                withdrawMessage.textContent = `Successfully withdrew $${withdrawAmount.toFixed(2)}!`;
                withdrawMessage.classList.remove('text-yellow-400');
                withdrawMessage.classList.add('text-green-400');
                setTimeout(() => {
                    withdrawModal.classList.add('hidden');
                    withdrawMessage.classList.add('hidden');
                }, 1500);
            }, 2000); 
        }
    });

    tradingAmountInput.addEventListener('input', () => {
        const amount = parseFloat(tradingAmountInput.value);
        let returnRate = 0;
        if (amount >= 50 && amount <= 499) {
            returnRate = 0.15;
        } else if (amount >= 500 && amount <= 999) {
            returnRate = 0.30;
        } else if (amount >= 1000) {
            returnRate = 0.50;
        }
        const totalReturn = amount * returnRate;
        tradingTotalInput.value = isNaN(totalReturn) ? '0.00' : totalReturn.toFixed(2);
    });

    const executeTrade = () => {
        const amount = parseFloat(tradingAmountInput.value);
        const returnAmount = parseFloat(tradingTotalInput.value);
        
        if (isNaN(amount) || amount <= 0 || amount < 50) {
            tradingMessage.textContent = 'Minimum investment is \$50.';
            tradingMessage.classList.remove('hidden', 'text-green-400');
            tradingMessage.classList.add('text-red-400');
            if (isTWA) Telegram.WebApp.MainButton.setParams({ color: Telegram.WebApp.themeParams.destructive_text_color }).setText('ERROR').show();
        } else if (amount > balance) {
            tradingMessage.textContent = 'Insufficient funds. Please deposit more money.';
            tradingMessage.classList.remove('hidden', 'text-green-400');
            tradingMessage.classList.add('text-red-400');
            if (isTWA) Telegram.WebApp.MainButton.setParams({ color: Telegram.WebApp.themeParams.destructive_text_color }).setText('FUNDS REQUIRED').show();
        } else {
            balance -= amount;
            
            transactions.unshift({
                id: generateID(),
                date: Date.now(),
                type: 'TRADE',
                amount: amount,
                status: 'Completed'
            });
            
            updateBalances();
            renderTransactions();
            tradingAmountInput.value = '';
            tradingTotalInput.value = '';
            tradingMessage.textContent = `Trade successful! Potential return: $${returnAmount.toFixed(2)}`;
            tradingMessage.classList.remove('hidden', 'text-red-400');
            tradingMessage.classList.add('text-green-400');

            if (isTWA) Telegram.WebApp.MainButton.hide();

            setTimeout(() => {
                tradingMessage.classList.add('hidden');
            }, 3000);
        }
    }

    tradingBuyBtn.addEventListener('click', executeTrade);
    
    // --- Initialization ---
    updateBalances();
    renderTransactions();
    navigateTo('dashboard', document.querySelector('.nav-link[data-page="dashboard"]'));

});
