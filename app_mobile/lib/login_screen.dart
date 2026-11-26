// Mostra login e cadastro de cliente no app.
// Após a API confirmar a entrada, onLogin pede a main.dart para abrir a vitrine.

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
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _registering = false;
  bool _showNotice = true;
  bool _loading = false;
  String? _error;

  // Alterna entre login e cadastro, mantendo o e-mail digitado e limpando a senha.
  void _switchMode() {
    final email = _email.text;
    _form.currentState?.reset();
    _email.text = email;
    _password.clear();
    setState(() {
      _registering = !_registering;
      _showNotice = false;
      _error = null;
    });
  }

  //app login: lê os campos e chama FreelikeApi.login em freelike_api.dart; sucesso abre a vitrine
  Future<void> _submit() async {
    if (_loading || !_form.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final email = _email.text.trim();
      if (_registering) {
        // No modo de cadastro, chama POST /api/auth/register pela FreelikeApi.
        await widget.api.registerClient(
          _name.text.trim(),
          email,
          _password.text,
        );
      } else {
        await widget.api.login(email, _password.text);
      }
      if (!mounted) return;
      widget.onLogin();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error is ApiError
            ? error.message
            : _registering
            ? 'Não foi possível criar a conta.'
            : 'Não foi possível entrar.';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final message =
        _error ?? (_showNotice && !_registering ? widget.notice : null);
    final title = _registering ? 'Criar conta' : 'Entrar';
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
                          Text(title, style: theme.textTheme.headlineMedium),
                          const SizedBox(height: 6),
                          Text(
                            _registering
                                ? 'Crie sua conta de cliente para explorar e dar like.'
                                : 'Use sua conta de cliente.',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 26),
                          if (_registering) ...[
                            TextFormField(
                              key: const ValueKey('name'),
                              controller: _name,
                              enabled: !_loading,
                              decoration: const InputDecoration(
                                labelText: 'Nome',
                              ),
                              textCapitalization: TextCapitalization.words,
                              textInputAction: TextInputAction.next,
                              autofillHints: const [AutofillHints.name],
                              validator: (value) {
                                final length = (value ?? '')
                                    .trim()
                                    .runes
                                    .length;
                                return length < 3 || length > 100
                                    ? 'Informe um nome de 3 a 100 caracteres.'
                                    : null;
                              },
                            ),
                            const SizedBox(height: 18),
                          ],
                          TextFormField(
                            key: const ValueKey('email'),
                            controller: _email,
                            enabled: !_loading,
                            decoration: const InputDecoration(
                              labelText: 'E-mail',
                            ),
                            keyboardType: TextInputType.emailAddress,
                            textInputAction: TextInputAction.next,
                            autofillHints: const [AutofillHints.email],
                            validator: (value) {
                              final email = (value ?? '').trim();
                              final valid = _registering
                                  ? RegExp(
                                      r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                                    ).hasMatch(email)
                                  : email.contains('@');
                              return valid ? null : 'Informe um e-mail válido.';
                            },
                          ),
                          const SizedBox(height: 18),
                          TextFormField(
                            key: const ValueKey('password'),
                            controller: _password,
                            enabled: !_loading,
                            decoration: const InputDecoration(
                              labelText: 'Senha',
                            ),
                            obscureText: true,
                            textInputAction: TextInputAction.done,
                            autofillHints: [
                              _registering
                                  ? AutofillHints.newPassword
                                  : AutofillHints.password,
                            ],
                            onFieldSubmitted: (_) => _submit(),
                            validator: (value) {
                              final password = value ?? '';
                              if (_registering && password.runes.length < 6) {
                                return 'Use pelo menos 6 caracteres.';
                              }
                              return password.isEmpty
                                  ? 'Informe sua senha.'
                                  : null;
                            },
                          ),
                          if (message != null) ...[
                            const SizedBox(height: 12),
                            Semantics(
                              liveRegion: true,
                              child: Text(
                                message,
                                style: TextStyle(
                                  color: theme.colorScheme.error,
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 22),
                          FilledButton(
                            onPressed: _loading ? null : _submit,
                            child: Text(
                              _loading
                                  ? (_registering
                                        ? 'Criando conta...'
                                        : 'Entrando...')
                                  : title,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: _loading ? null : _switchMode,
                            child: Text(
                              _registering
                                  ? 'Voltar para entrar'
                                  : 'Criar conta',
                            ),
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
