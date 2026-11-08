"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dreams = void 0;
exports.getAllDreams = getAllDreams;
exports.getDream = getDream;
exports.getRandomDream = getRandomDream;
exports.dreams = [
    {
        name: 'Buy a Forest',
        description: 'Stop the loss of ancient trees. Donate 1,000 acres of forest and create a nature walk for all to enjoy',
        cost: 250000,
    },
    {
        name: 'Pro Team Box Seats',
        description: 'License a 12 person private skybox booth with food and beverage service at your favorite team\'s stadium',
        cost: 200000,
    },
    {
        name: 'Ancient Asian Cities',
        description: 'A private plane and guide take you and 5 friends to the most remote spots of Asia where no tourists have gone before.',
        cost: 150000,
    },
    {
        name: 'A Stock Market For Kids',
        description: 'Fund a business and investment school for young capitalists, teaching them the basics of business. School includes a mini stock exchange run by the students.',
        cost: 125000,
    },
    {
        name: 'Yacht Racing',
        description: 'You and your crew fly to Perth Australia. Spend one week racing a 12-meter against the fastest boats in the world.',
        cost: 150000,
    },
    {
        name: 'Cannes Film Festival',
        description: 'Party with the stars! Tour France, plus one week in Cannes rubbing elbows with celebrities. You even land a starring role!',
        cost: 125000,
    },
    {
        name: 'Private Fishing Cabin on a Montana Lake',
        description: 'Fish from the dock of this remote cabin. Enjoy 6 months of solitude. Use of float plane included.',
        cost: 100000,
    },
    {
        name: 'Park Named After You',
        description: 'Tear down abandoned warehouse and build a new recreational park. Donate police sub-station for park safety.',
        cost: 225000,
    },
    {
        name: 'Run for Mayor',
        description: 'Your financial expertise spurs masses of people to beg you to lead the city. You run and, of course, win. This is the start of your Presidential race.',
        cost: 125000,
    },
    {
        name: 'A Gift of Faith',
        description: 'Your religious organization is growing by leaps and bounds. New buildings are needed.',
        cost: 175000,
    },
    {
        name: 'Heli-Ski the Swiss Alps',
        description: 'A winter of helicopter skiing by day and playing at the glamorous hot spots at night. A medieval castle is your accommodation.',
        cost: 150000,
    },
    {
        name: 'Dinner with the President',
        description: 'Buy a table for 10 friends to dine with the President at a gala ball for visiting dignitaries from around the world.',
        cost: 100000,
    },
    {
        name: 'A Research Center for Cancer & AIDS',
        description: 'Your money brings together top researchers & doctors in one place, dedicated to eliminating these two diseases.',
        cost: 225000,
    },
    {
        name: '7 Wonders of the World',
        description: 'Go by plane, boat, bicycle, camel, canoe & limo to the 7 Wonders of the World. First class luxury all the way!',
        cost: 200000,
    },
    {
        name: 'Save the Ocean Mammals',
        description: 'Fund and be a crew member on a month-long research expedition to protect endangered sea animals.',
        cost: 125000,
    },
    {
        name: 'Be a "Jet-Setter"',
        description: 'Have your own personal jet available for one year, to whisk you away whenever and wherever your heart desires',
        cost: 250000,
    },
    {
        name: 'Golf Around the World',
        description: 'You take 3 friends on a first-class, 5-star resort tour to play the 50 best golf courses in the world.',
        cost: 150000,
    },
    {
        name: 'A Kid\'s Library',
        description: 'Add a wing to your city\'s library devoted to young writers and artists. Art celebrities visit often to support your work.',
        cost: 175000,
    },
    {
        name: 'South Sea Island Fantasy',
        description: 'Pampered in luxury for two full months. Relax, unwind in warm waters, deserted beaches, and romantic nights.',
        cost: 100000,
    },
    {
        name: 'Capitalists\' Peace Corps',
        description: 'Set up entrepreneurial business schools in 3rd world nations. Instructors are business people donating their knowledge & time.',
        cost: 200000,
    },
    {
        name: 'Cruise the Mediterranean',
        description: 'Visit small harbours in Italy, France and Greece for a month with 12 friends on your private yacht.',
        cost: 100000,
    },
    {
        name: 'A Mini-Farm in the City',
        description: 'Create a hands-on farm eco-system for city kids to learn and care for animals and plants.',
        cost: 150000,
    },
    {
        name: 'African Photo Safari',
        description: 'Take 6 friends on a wild safari photographing the most exotic animals in the world. Enjoy 5-star luxury in your tent.',
        cost: 100000,
    },
];
function getAllDreams() {
    return exports.dreams;
}
function getDream(name) {
    return exports.dreams.find((dream) => dream.name === name);
}
function getRandomDream() {
    return exports.dreams[Math.floor(Math.random() * exports.dreams.length)];
}
//# sourceMappingURL=dreams.js.map