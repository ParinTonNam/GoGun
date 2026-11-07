// Offline verification only. Production still uses the actual Google Fonts.
// This deliberately uses installed system fonts, so it cannot verify typography.
module.exports = {
  'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap':
    "@font-face { font-family: 'Kanit'; src: local('Tahoma'); font-style: normal; font-weight: 300 600; }",
  'https://fonts.googleapis.com/css2?family=Wix+Madefor+Display:wght@400..800&display=swap':
    "@font-face { font-family: 'Wix Madefor Display'; src: local('Arial'); font-style: normal; font-weight: 400 800; }",
};
