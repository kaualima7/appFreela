// Carrega a capa pela URL e mostra um ícone enquanto carrega ou se houver erro.

import 'package:flutter/material.dart';

class ServiceCover extends StatelessWidget {
  const ServiceCover({super.key, required this.url, this.height = 168});

  final String url;
  final double height;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final placeholder = ColoredBox(
      color: colors.surfaceContainerHighest,
      child: Center(
        child: Icon(
          Icons.image_outlined,
          color: colors.onSurfaceVariant,
          size: 24,
        ),
      ),
    );

    return SizedBox(
      height: height,
      width: double.infinity,
      child: Image.network(
        url,
        fit: BoxFit.cover,
        webHtmlElementStrategy: WebHtmlElementStrategy.fallback,
        frameBuilder: (context, child, frame, loadedSynchronously) =>
            loadedSynchronously || frame != null ? child : placeholder,
        errorBuilder: (_, _, _) => placeholder,
      ),
    );
  }
}
