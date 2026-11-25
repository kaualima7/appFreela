import 'package:flutter/material.dart';

import 'freelike_api.dart';
import 'freelike_brand.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.api,
    required this.onLogin,
    this.notice,
  });

  final FreelikeApi api;
  final VoidCallback onLogin;
  final String? notice;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    if (_loading || !_form.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.api.login(_email.text.trim(), _password.text);
      if (!mounted) return;
      widget.onLogin();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error is ApiError ? error.message : 'Não foi possível entrar.';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final message = _error ?? widget.notice;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 26),
                  child: AutofillGroup(
                    child: Form(
                      key: _form,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Align(
                            alignment: Alignment.centerLeft,
                            child: FreelikeBrand(large: true),
                          ),
                          const SizedBox(height: 22),
                          Text('Entrar', style: theme.textTheme.headlineMedium),
                          const SizedBox(height: 6),
                          Text(
                            'Use sua conta de cliente.',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 26),
                          TextFormField(
                            controller: _email,
                            enabled: !_loading,
                            decoration: const InputDecoration(
                              labelText: 'E-mail',
                            ),
                            keyboardType: TextInputType.emailAddress,
                            textInputAction: TextInputAction.next,
                            autofillHints: const [AutofillHints.email],
                            validator: (value) =>
                                (value ?? '').trim().contains('@')
                                ? null
                                : 'Informe seu e-mail.',
                          ),
                          const SizedBox(height: 18),
                          TextFormField(
                            controller: _password,
                            enabled: !_loading,
                            decoration: const InputDecoration(
                              labelText: 'Senha',
                            ),
                            obscureText: true,
                            textInputAction: TextInputAction.done,
                            autofillHints: const [AutofillHints.password],
                            onFieldSubmitted: (_) => _login(),
                            validator: (value) => (value ?? '').isEmpty
                                ? 'Informe sua senha.'
                                : null,
                          ),
                          if (message != null) ...[
                            const SizedBox(height: 12),
                            Text(
                              message,
                              style: TextStyle(color: theme.colorScheme.error),
                            ),
                          ],
                          const SizedBox(height: 22),
                          FilledButton(
                            onPressed: _loading ? null : _login,
                            child: Text(_loading ? 'Entrando...' : 'Entrar'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
