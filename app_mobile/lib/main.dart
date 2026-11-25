import 'package:flutter/material.dart';

import 'catalog_screen.dart';
import 'freelike_api.dart';
import 'freelike_theme.dart';
import 'login_screen.dart';

void main() => runApp(const FreelikeApp());

class FreelikeApp extends StatefulWidget {
  const FreelikeApp({super.key});

  @override
  State<FreelikeApp> createState() => _FreelikeAppState();
}

class _FreelikeAppState extends State<FreelikeApp> {
  final _navigator = GlobalKey<NavigatorState>();
  late final _api = FreelikeApi(onSessionExpired: _expireSession);
  bool _signedIn = false;
  String? _loginNotice;

  void _openCatalog() {
    setState(() {
      _loginNotice = null;
      _signedIn = true;
    });
  }

  void _expireSession() => _showLogin('Sua sessão expirou. Entre novamente.');

  void _showLogin([String? notice]) {
    _api.logout();
    _navigator.currentState?.popUntil((route) => route.isFirst);
    setState(() {
      _loginNotice = notice;
      _signedIn = false;
    });
  }

  @override
  void dispose() {
    _api.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Freelike',
      navigatorKey: _navigator,
      debugShowCheckedModeBanner: false,
      theme: buildFreelikeTheme(),
      home: _signedIn
          ? CatalogScreen(api: _api, onLogout: () => _showLogin())
          : LoginScreen(api: _api, onLogin: _openCatalog, notice: _loginNotice),
    );
  }
}
