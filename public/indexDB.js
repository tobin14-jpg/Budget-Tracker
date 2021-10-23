// create variable to hold db connection
let db;
// establish a connection to IndexedDB database 
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function (e) {
    console.log('Upgrade needed in IndexDB');
  
    const { oldVersion } = e;
    const newVersion = e.newVersion || db.version;
  
    console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);
  
    db = e.target.result;
  
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onerror = function (e) {
    console.log(`Woops! ${e.target.errorCode}`);
};
  
request.onsuccess = function(e) {
    console.log('success');
    db = e.target.result;
   
    if (navigator.onLine) {
      uploadTransaction();
    }
};

function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // access the object store 
    const budgetObjectStore = transaction.objectStore('new_transaction');
  
    // add record to store with add method
    budgetObjectStore.add(record);
};

// function that will handle collecting all of the data 
function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // access object store
    const budgetObjectStore = transaction.objectStore('new_transaction');
  
    // get all transactions from store and set to a variable
    const getAll = budgetObjectStore.getAll();
  
    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
    // if there was data in indexedDb's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          // access the object store
          const budgetObjectStore = transaction.objectStore('new_transaction');
          // clear all items in your store
          budgetObjectStore.clear();

          alert('All saved transactions have been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);