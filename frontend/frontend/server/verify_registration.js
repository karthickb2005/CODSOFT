const axios = require('axios');

const registerUser = async () => {
    try {
        const newUser = {
            name: 'Test Register',
            email: `testreg_${Date.now()}@example.com`,
            password: 'password123'
        };

        console.log('Attempting to register user:', newUser.email);

        const response = await axios.post('http://localhost:5001/api/users', newUser);

        if (response.status === 201) {
            console.log('Registration successful!');
            console.log('User ID:', response.data._id);
            console.log('Token:', response.data.token ? 'Received' : 'Missing');
        } else {
            console.log('Unexpected status:', response.status);
        }
    } catch (error) {
        console.error('Registration failed:', error.response?.data || error.message);
    }
};

registerUser();
