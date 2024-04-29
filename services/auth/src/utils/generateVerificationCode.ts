export const generateVerificationCode = () => {
	// Get current timestamp as a string
	const timestamp = new Date().getTime().toString();

	// Generate a random two-digit number
	const randomNumber = Math.floor(10 + Math.random() * 90);

	// Concatenate timestamp and random number, then take the last 5 digits
	const code = (timestamp + randomNumber).slice(-5);

	return code;
};
