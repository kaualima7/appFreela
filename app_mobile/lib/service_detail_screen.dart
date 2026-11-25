import 'package:flutter/material.dart';

import 'freelike_api.dart';
import 'service.dart';
import 'service_cover.dart';

class ServiceDetailScreen extends StatefulWidget {
  const ServiceDetailScreen({
    super.key,
    required this.api,
    required this.serviceId,
  });

  final FreelikeApi api;
  final int serviceId;

  @override
  State<ServiceDetailScreen> createState() => _ServiceDetailScreenState();
}

class _ServiceDetailScreenState extends State<ServiceDetailScreen> {
  ServiceOffer? _offer;
  bool _interested = false;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final offer = await widget.api.service(widget.serviceId);
      if (!mounted) return;
      final interested = await widget.api.isInterested(widget.serviceId);
      if (!mounted) return;
      setState(() {
        _offer = offer;
        _interested = interested;
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error is ApiError
              ? error.message
              : 'Não foi possível carregar o anúncio.';
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleInterest() async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      final interested = await widget.api.changeInterest(
        widget.serviceId,
        !_interested,
      );
      if (!mounted) return;
      setState(() => _interested = interested);
      _message(interested ? 'Like enviado.' : 'Like retirado.');
    } catch (error) {
      if (!mounted) return;
      if (error is ApiError && error.statusCode == 401) return;
      _message(
        error is ApiError
            ? error.message
            : 'Não foi possível atualizar o like.',
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _message(String text) {
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(SnackBar(content: Text(text)));
  }

  Widget _content() {
    if (_loading) return const Center(child: Text('Carregando anúncio...'));
    final offer = _offer;
    if (_error != null || offer == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error ?? 'Anúncio indisponível.'),
              TextButton(
                onPressed: _load,
                child: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }

    final cover = widget.api.coverUrl(offer.imageUrl);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final actionIcon = Icon(
      _interested ? Icons.favorite_rounded : Icons.favorite_border_rounded,
    );
    final actionLabel = Text(
      _saving
          ? 'Salvando...'
          : _interested
          ? 'Retirar interesse'
          : 'Demonstrar interesse',
    );

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 640),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
          children: [
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (cover != null) ServiceCover(url: cover, height: 212),
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(offer.title, style: theme.textTheme.headlineSmall),
                        const SizedBox(height: 4),
                        Text(
                          offer.professionalName,
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          'A partir de',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                        Text(
                          offer.formattedPrice,
                          style: theme.textTheme.titleLarge?.copyWith(
                            color: colors.primary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Divider(height: 1),
                        const SizedBox(height: 16),
                        Text('Descrição', style: theme.textTheme.titleMedium),
                        const SizedBox(height: 6),
                        Text(
                          offer.description,
                          style: theme.textTheme.bodyLarge,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_interested)
              FilledButton.tonalIcon(
                onPressed: _saving ? null : _toggleInterest,
                icon: actionIcon,
                label: actionLabel,
              )
            else
              FilledButton.icon(
                onPressed: _saving ? null : _toggleInterest,
                icon: actionIcon,
                label: actionLabel,
              ),
            const SizedBox(height: 8),
            Text(
              'Ao dar like, seu nome e e-mail ficam disponíveis para o freelancer.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalhes do anúncio')),
      body: SafeArea(child: _content()),
    );
  }
}
