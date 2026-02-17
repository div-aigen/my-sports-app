import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
    paddingLeft: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoCardTappable: {
    borderLeftColor: '#1565C0',
  },
  infoCardFullWidth: {
    flex: 0,
    width: '100%',
  },
  mapsLinkText: {
    fontSize: 11,
    color: '#1565C0',
    fontWeight: '600',
    marginTop: 4,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  infoCardSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  participantsSection: {
    marginBottom: 20,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#c8e6c9',
    color: '#2e7d32',
  },
  statusFull: {
    backgroundColor: '#ffccbc',
    color: '#d84315',
  },
  emptyParticipants: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  emptyParticipantsText: {
    color: '#999',
    fontSize: 14,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  creatorBadge: {
    fontSize: 10,
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
    marginTop: 2,
  },
  participantCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  modalActionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  modalJoinButton: {
    backgroundColor: '#4CAF50',
  },
  modalLeaveButton: {
    backgroundColor: '#FF9800',
  },
  modalCancelButton: {
    backgroundColor: '#f44336',
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  inviteButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default styles;
