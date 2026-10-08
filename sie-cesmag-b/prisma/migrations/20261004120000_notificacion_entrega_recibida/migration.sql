-- Nuevo tipo de notificación: avisar a quien revisa (responsable de etapa, o
-- todo el personal con permiso si no hay uno asignado) que el emprendedor
-- entregó o volvió a entregar evidencia — antes solo se avisaba al revés
-- (resultado_revision, del revisor hacia el emprendedor).
ALTER TYPE "TipoNotificacion" ADD VALUE 'entrega_recibida';
