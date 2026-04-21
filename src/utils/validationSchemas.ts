// Validation schemas for forms
export const loginValidation = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  },
  phone: {
    required: 'Phone number is required',
    pattern: {
      value: /^\+?[1-9]\d{1,14}$/,
      message: 'Invalid phone number'
    }
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'Password must be at least 6 characters'
    }
  }
};

export const signupValidation = {
  name: {
    required: 'Full name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters'
    }
  },
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  },
  phone: {
    required: 'Phone number is required',
    pattern: {
      value: /^\+?[1-9]\d{1,14}$/,
      message: 'Invalid phone number'
    }
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters'
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must contain uppercase, lowercase and number'
    }
  },
  confirmPassword: {
    required: 'Please confirm your password'
  }
};
