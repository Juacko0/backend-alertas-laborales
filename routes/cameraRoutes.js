const express = require('express');
const router = express.Router();
const Camara = require('../models/Camara');

// Obtener todas las cámaras
router.get('/listCameras', async (req, res) => {
  try {
    const camaras = await Camara.find();
    res.json(camaras);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al listar cámaras' });
  }
});

// Crear o agregar nueva cámara
router.post('/addCamera', async (req, res) => {
  try {
    const { nombre, url } = req.body;
    const nuevaCamara = new Camara({ nombre, url });
    await nuevaCamara.save();
    res.status(201).json({ message: 'Cámara creada', camara: nuevaCamara });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear cámara' });
  }
});

// Editar cámara
router.put('/updateCamera/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;
    const camara = await Camara.findByIdAndUpdate(id, datos, { new: true });
    if (!camara) return res.status(404).json({ message: 'Cámara no encontrada' });
    res.json({ message: 'Cámara actualizada', camara });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar cámara' });
  }
});

// Borrar cámara
router.delete('/deleteCamera/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Camara.findByIdAndDelete(id);
    res.json({ message: 'Cámara eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar cámara' });
  }
});

module.exports = router;
