import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { Header } from '../components/ui/Header';
import { useThemeColors } from '../lib/theme';

type LegalRoute = RouteProp<RootStackParamList, 'LegalDocument'>;

type DocType = RootStackParamList['LegalDocument']['type'];

const TERMS_TEXT = `Bienvenue sur NAQIAGO, votre service de lavage de voitures sans eau. En utilisant notre site web ou nos services, vous acceptez les conditions générales suivantes. Veuillez les lire attentivement avant de procéder à une réservation.

1. Acceptation des Conditions
En utilisant les services de NAQIAGO, vous acceptez d'être lié par ces conditions générales. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.

2. Services Proposés
NAQIAGO propose un service de lavage de voitures sans eau, incluant le nettoyage intérieur et extérieur des véhicules. Nos services sont disponibles sur rendez-vous et sont effectués à votre domicile ou lieu de travail.

3. Réservations et Paiements
Les réservations peuvent être effectuées via notre site web ou notre application mobile. Les paiements peuvent être effectués en ligne via carte bancaire, en espèce, ou par virement bancaire.
Toute réservation non annulée 24 heures à l'avance peut entraîner des frais d'annulation.

4. Politique d’Annulation
Vous pouvez annuler ou modifier votre réservation sans frais jusqu'à 24 heures avant l'heure prévue. Pour toute annulation effectuée moins de 24 heures à l'avance, des frais d'annulation peuvent s'appliquer.

5. Responsabilité
NAQIAGO décline toute responsabilité en cas de dommages causés à votre véhicule en raison de conditions préexistantes ou de l'utilisation de produits non adaptés. Si vous constatez un problème après notre service, veuillez nous contacter immédiatement à contact@naqiago.com.

6. Engagement Écologique
NAQIAGO s'engage à protéger l'environnement en utilisant des produits 100 % biodégradables et une méthode de lavage sans eau. Chaque lavage permet d'économiser environ 150 litres d'eau.

7. Informations de Contact
Pour toute question ou réclamation, vous pouvez nous contacter à l'adresse e-mail suivante : contact@naqiago.com.

8. Modifications des Conditions
NAQIAGO se réserve le droit de modifier ces conditions générales à tout moment. Les modifications prendront effet dès leur publication sur notre site web.`;

const PRIVACY_TEXT = `Politique de Confidentialité de NAQIAGO

Chez NAQIAGO, nous prenons la protection de vos données personnelles très au sérieux. Cette politique de confidentialité explique comment nous collectons, utilisons, et protégeons vos informations lorsque vous utilisez notre site web ou nos services.

1. Collecte des Données
Nous collectons les informations suivantes lorsque vous utilisez nos services :
- Informations personnelles (nom, adresse e-mail, numéro de téléphone).
- Informations de localisation (adresse de livraison ou du service).
- Informations de paiement (carte bancaire, virement).
- Données techniques (adresse IP, type de navigateur, appareil utilisé).

2. Utilisation des Données
Les données collectées sont utilisées pour :
- Fournir et améliorer nos services.
- Traiter vos réservations et paiements.
- Vous contacter pour des mises à jour ou des offres spéciales.
- Analyser l'utilisation de notre site web pour optimiser l'expérience utilisateur.

3. Partage des Données
Nous ne partageons vos données personnelles qu'avec des tiers dans les cas suivants :
- Avec votre consentement explicite.
- Avec des prestataires de services (paiement, logistique) pour exécuter nos services.
- Pour se conformer à des obligations légales ou réglementaires.

4. Sécurité des Données
Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, modification, ou destruction.

5. Droits des Utilisateurs
Vous avez le droit de :
- Accéder à vos données personnelles.
- Demander la rectification ou la suppression de vos données.
- Vous opposer au traitement de vos données.
- Retirer votre consentement à tout moment.
Pour exercer ces droits, contactez-nous à contact@naqiago.com.

6. Cookies
Notre site web utilise des cookies pour améliorer votre expérience utilisateur. Vous pouvez désactiver les cookies dans les paramètres de votre navigateur, mais cela peut affecter certaines fonctionnalités du site.

7. Mises à Jour de la Politique
Nous nous réservons le droit de mettre à jour cette politique de confidentialité à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour révisée.

8. Informations de Contact
Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à l'adresse suivante : contact@naqiago.com.`;

export default function LegalDocumentScreen() {
  const navigation = useNavigation();
  const theme = useThemeColors();
  const route = useRoute<LegalRoute>();

  const type: DocType = route.params?.type ?? 'terms';

  const content = useMemo(() => {
    return type === 'privacy' ? PRIVACY_TEXT : TERMS_TEXT;
  }, [type]);

  const title = useMemo(() => {
    return type === 'privacy' ? 'Politique de confidentialité' : 'Conditions d\'utilisation';
  }, [type]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <Header title={title} onBack={() => (navigation as any).goBack?.()} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}> 
          <Text style={[styles.body, { color: theme.textPrimary }]}>{content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
  },
});
