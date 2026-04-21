import { CommonActions } from '@react-navigation/native';

export const safeGoBack = (navigation: any) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    // If there's no screen to go back to, navigate to the main tabs
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      })
    );
  }
};

export const safeGoBackOrNavigate = (navigation: any, fallbackRoute: string) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    navigation.navigate(fallbackRoute);
  }
};
