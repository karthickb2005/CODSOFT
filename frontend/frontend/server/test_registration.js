
const axios = require('axios');

const testRegistration = async () => {
    try {
        const response = await axios.post('http://localhost:5001/api/users', {
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password123'
        });
        console.log('Registration Success:', response.data);
    } catch (error) {
        console.error('Registration Failed:', error.response?.data || error.message);
    }
};

testRegistration();
