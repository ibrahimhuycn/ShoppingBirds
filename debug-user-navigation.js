// Debug script to check user data in navigation
// Run this in browser console when logged in

// Check if auth context is working
console.log('🔍 Debugging Navigation User Data...\n');

// Check localStorage
const storedUser = localStorage.getItem('shoppingbird_auth_user');
console.log('1. User in localStorage:', storedUser ? JSON.parse(storedUser) : 'Not found');

// Check if React components are loaded
console.log('2. React components check:');
console.log('- Navigation element:', document.querySelector('nav') ? 'Found' : 'Not found');
console.log('- Avatar element:', document.querySelector('[data-radix-collection-item]') ? 'Found' : 'Not found');
console.log('- Dropdown trigger:', document.querySelector('button[data-state]') ? 'Found' : 'Not found');

// Check if user data is in DOM
const userElements = document.querySelectorAll('*');
let foundUserData = false;
userElements.forEach(el => {
  if (el.textContent && (el.textContent.includes('@') || el.textContent.includes('Log out'))) {
    console.log('3. Found user-related element:', el.textContent.trim());
    foundUserData = true;
  }
});

if (!foundUserData) {
  console.log('3. No user data found in DOM elements');
}

// Check for dropdown menu
const dropdownTrigger = document.querySelector('button[role="button"]');
if (dropdownTrigger) {
  console.log('4. Found dropdown trigger, attempting click...');
  dropdownTrigger.click();
  setTimeout(() => {
    const dropdownContent = document.querySelector('[role="menu"]');
    console.log('5. Dropdown content after click:', dropdownContent ? 'Found' : 'Not found');
  }, 100);
} else {
  console.log('4. No dropdown trigger found');
}

console.log('\n✅ Debug complete - check the output above');